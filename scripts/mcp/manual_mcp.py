#!/usr/bin/env python3
"""
Corpus MCP Server — Query the LEMON/CHARM LMDB backend.

Run on the VPS:
    /opt/corpus-mcp/bin/python3 manual_mcp.py

Or from local machine via SSH (stdio forwarded):
    ssh root@116.202.210.109 /opt/corpus-mcp/bin/python3 /root/spotonauto.com/scripts/mcp/manual_mcp.py

Claude Code config (~/.mcp.json):
{
  "mcpServers": {
    "corpus": {
      "command": "ssh",
      "args": [
        "root@116.202.210.109",
        "/opt/corpus-mcp/bin/python3",
        "/root/spotonauto.com/scripts/mcp/manual_mcp.py"
      ]
    }
  }
}
"""

import os
import sys
import json
import re
import urllib.parse
from typing import Any
from urllib.parse import quote, urljoin, unquote

import httpx
from bs4 import BeautifulSoup
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

LMDB_BASE = os.environ.get("LMDB_URL", "http://127.0.0.1:8080")
client = httpx.Client(timeout=30.0, follow_redirects=True)

app = Server("corpus-mcp")


# ── Helpers ─────────────────────────────────────────────────────────────────


def _fetch(path: str) -> str:
    url = f"{LMDB_BASE}{path}"
    resp = client.get(url)
    resp.raise_for_status()
    return resp.text


def _resolve_link(href: str, base_path: str) -> str | None:
    if not href or href.startswith("#") or href.startswith("javascript:"):
        return None
    if href.startswith("/") and not re.match(r"^/\w+/(\d{4}|\w+)", href):
        return None
    if href.startswith("http://") or href.startswith("https://"):
        return None
    if href.startswith("/"):
        return href
    if base_path.endswith("/"):
        resolved = urljoin(base_path, href)
    else:
        base_dir = base_path.rsplit("/", 1)[0] + "/"
        resolved = urljoin(base_dir, href)
    return resolved


def _parse_links(html: str, base_path: str = "/") -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    links = []
    seen = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        resolved = _resolve_link(href, base_path)
        if not resolved or resolved in seen:
            continue
        seen.add(resolved)
        text = a.get_text(strip=True)
        links.append({"path": resolved, "name": text})
    return links


def _extract_tables(html: str) -> list[list[list[str]]]:
    soup = BeautifulSoup(html, "html.parser")
    tables = []
    for table in soup.find_all("table"):
        rows = []
        for tr in table.find_all("tr"):
            cells = []
            for td in tr.find_all(["td", "th"]):
                text = td.get_text(separator=" ", strip=True)
                cells.append(text)
            if cells:
                rows.append(cells)
        if rows:
            tables.append(rows)
    return tables


def _is_header_row(row: list[str]) -> bool:
    if len(row) <= 1:
        return False
    header_keywords = {"type", "spec", "application", "standard", "metric", "capacity",
                       "size", "torque", "gap", "fluid", "part", "note", "position",
                       "drive", "body", "option", "gvwr", "pressure", "wheel", "rim",
                       "bolt", "pattern", "front", "rear", "engine", "trans", "code"}
    text = " ".join(c.lower() for c in row if c)
    words = set(text.split())
    return len(words & header_keywords) >= 1


def _clean_table(tables: list) -> list[dict]:
    result = []
    for table in tables:
        if not table:
            continue
        header_idx = 0
        for i, row in enumerate(table):
            if _is_header_row(row):
                header_idx = i
                break
        headers = table[header_idx]
        rows = []
        for row in table[header_idx + 1:]:
            row_dict = {}
            for i, cell in enumerate(row):
                key = headers[i] if i < len(headers) else f"col_{i}"
                row_dict[key] = cell
            rows.append(row_dict)
        result.append({"headers": headers, "rows": rows})
    return result


def _extract_text_specs(html: str) -> dict[str, list[str]]:
    """
    Parse the LEMON '(Single Page)' Common Specs text format.
    Returns sections like {'Ignition': ['Spark Plugs', 'Type', '...'], ...}
    """
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    lines = [l.strip() for l in text.splitlines() if l.strip()]

    # Known section headers in LEMON Common Specs & Procedures
    known_sections = {
        'Air Conditioning', 'Axle Nut/Hub Nut', 'Battery', 'Brakes', 'Charging',
        'Drive Belts', 'Engine Cooling', 'Engine Mechanical', 'Fluid Specifications',
        'Fuel System', 'Ignition', 'Starting', 'Steering', 'Suspension',
        'Wheel Alignment', 'Wheel & Tire', 'Tire & Wheel', 'Wheels & Tires',
        'Compression', 'Oil Pressure', 'Overhaul', 'Torque', 'General Specifications',
        'Specifications', 'Component Locations', 'Fuse & Relay', 'Wiring Diagrams',
    }

    sections: dict[str, list[str]] = {}
    current = None
    items: list[str] = []

    skip = {
        'Home', 'System', 'Specification/Procedure', 'LEMON Manuals',
        ': Even more car manuals for everyone',
        ' scientia non olet', '·', 'About LEMON Manuals',
    }

    for line in lines:
        if line in skip or line.startswith('>>') or line.startswith('April '):
            continue
        if 'COMMON SPECS' in line.upper() or 'COMMON SPECIFICATIONS' in line.upper():
            continue

        # Detect section headers
        if line in known_sections or (line.endswith(' Specifications') and len(line) < 40):
            if current and items:
                sections[current] = items
            current = line
            items = []
            continue

        if current:
            items.append(line)

    if current and items:
        sections[current] = items

    return sections


def _find_single_page_specs_path(make: str, year: int, model: str) -> str | None:
    """Find the deepest Common Specs & Procedures leaf page in the (Single Page) tree."""
    root = f"/{quote(make)}/{year}/{quote(model)}/"
    sp_root = f"{root}Repair%20and%20Diagnosis%20%28Single%20Page%29/"

    try:
        html = _fetch(sp_root)
    except Exception:
        return None

    links = _parse_links(html, sp_root)
    # Look for Common Specs or Specifications Index directly on SP root
    # Different makes use different naming: Ford/Kia = "Common Specs", Toyota = "Specifications Index"
    specs_links = [l for l in links if 'common spec' in l['name'].lower() or 'common specification' in l['name'].lower() or 'specifications index' in l['name'].lower()]

    if not specs_links:
        return None

    # Return the deepest path (longest URL = leaf page with actual content)
    deepest = max(specs_links, key=lambda l: len(l['path']))
    return deepest['path']


# ── Tools ────────────────────────────────────────────────────────────────────

TOOLS = [
    Tool(name="list_makes", description="List all vehicle makes.", inputSchema={"type": "object", "properties": {}}),
    Tool(name="list_years", description="List years for a make.", inputSchema={"type": "object", "properties": {"make": {"type": "string"}}, "required": ["make"]}),
    Tool(name="list_models", description="List models for make/year.", inputSchema={"type": "object", "properties": {"make": {"type": "string"}, "year": {"type": "integer"}}, "required": ["make", "year"]}),
    Tool(name="get_tree", description="Get manual tree up to depth.", inputSchema={"type": "object", "properties": {"make": {"type": "string"}, "year": {"type": "integer"}, "model": {"type": "string"}, "depth": {"type": "integer", "default": 3}}, "required": ["make", "year", "model"]}),
    Tool(name="get_page", description="Fetch HTML for a path.", inputSchema={"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]}),
    Tool(name="find_pages", description="BFS search for pages by keyword.", inputSchema={"type": "object", "properties": {"make": {"type": "string"}, "year": {"type": "integer"}, "model": {"type": "string"}, "keyword": {"type": "string"}, "max_results": {"type": "integer", "default": 20}}, "required": ["make", "year", "model", "keyword"]}),
    Tool(name="extract_tables", description="Extract tables from a page.", inputSchema={"type": "object", "properties": {"path": {"type": "string"}, "map_headers": {"type": "boolean", "default": True}}, "required": ["path"]}),
    Tool(name="get_quick_lookups", description="Find Quick Lookups pages.", inputSchema={"type": "object", "properties": {"make": {"type": "string"}, "year": {"type": "integer"}, "model": {"type": "string"}}, "required": ["make", "year", "model"]}),
    Tool(name="get_fluids", description="Extract fluid specs.", inputSchema={"type": "object", "properties": {"make": {"type": "string"}, "year": {"type": "integer"}, "model": {"type": "string"}}, "required": ["make", "year", "model"]}),
    Tool(name="get_tire_fitment", description="Extract tire fitment.", inputSchema={"type": "object", "properties": {"make": {"type": "string"}, "year": {"type": "integer"}, "model": {"type": "string"}}, "required": ["make", "year", "model"]}),
    Tool(name="get_specs_index", description="Extract Specifications Index.", inputSchema={"type": "object", "properties": {"make": {"type": "string"}, "year": {"type": "integer"}, "model": {"type": "string"}}, "required": ["make", "year", "model"]}),
    Tool(name="get_battery_location", description="Find battery pages.", inputSchema={"type": "object", "properties": {"make": {"type": "string"}, "year": {"type": "integer"}, "model": {"type": "string"}}, "required": ["make", "year", "model"]}),
    Tool(name="get_spark_plugs", description="Extract spark plug specs from Single Page tree.", inputSchema={"type": "object", "properties": {"make": {"type": "string"}, "year": {"type": "integer"}, "model": {"type": "string"}}, "required": ["make", "year", "model"]}),
    Tool(name="get_drive_belts", description="Extract drive belt specs from Single Page tree.", inputSchema={"type": "object", "properties": {"make": {"type": "string"}, "year": {"type": "integer"}, "model": {"type": "string"}}, "required": ["make", "year", "model"]}),
    Tool(name="get_all_specs", description="Extract ALL specs from the Single Page Common Specs & Procedures page.", inputSchema={"type": "object", "properties": {"make": {"type": "string"}, "year": {"type": "integer"}, "model": {"type": "string"}}, "required": ["make", "year", "model"]}),
]


@app.list_tools()
async def list_tools() -> list[Tool]:
    return TOOLS


@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    try:
        result = await _handle_tool(name, arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2, ensure_ascii=False))]
    except Exception as e:
        return [TextContent(type="text", text=json.dumps({"error": str(e)}, indent=2))]


# ── Tool Handlers ───────────────────────────────────────────────────────────


async def _handle_tool(name: str, args: dict) -> Any:
    if name == "list_makes":
        html = _fetch("/")
        links = _parse_links(html, "/")
        return {"makes": sorted([l["name"] for l in links if l["path"] != "/"])}

    if name == "list_years":
        make = args["make"]
        html = _fetch(f"/{quote(make)}/")
        links = _parse_links(html, f"/{quote(make)}/")
        years = []
        for l in links:
            m = re.search(r"/\d{4}/", l["path"])
            if m:
                y = int(m.group(0).strip("/"))
                if y not in years:
                    years.append(y)
        return {"make": make, "years": sorted(years)}

    if name == "list_models":
        make, year = args["make"], args["year"]
        html = _fetch(f"/{quote(make)}/{year}/")
        links = _parse_links(html, f"/{quote(make)}/{year}/")
        models = []
        for l in links:
            parts = l["path"].rstrip("/").split("/")
            if len(parts) >= 4:
                model_name = unquote(parts[3])
                if model_name not in models:
                    models.append(model_name)
        return {"make": make, "year": year, "models": models}

    if name == "get_tree":
        make, year, model = args["make"], args["year"], args["model"]
        depth = min(args.get("depth", 3), 5)
        root = f"/{quote(make)}/{year}/{quote(model)}/"

        def recurse(path: str, current_depth: int) -> dict:
            try:
                html = _fetch(path)
            except Exception as e:
                return {"name": unquote(path.rstrip("/").split("/")[-1]) if "/" in path.strip("/") else path, "path": path, "error": str(e)}
            links = _parse_links(html, path)
            children = []
            if current_depth < depth:
                for l in links:
                    if l["path"] != path and len(l["path"].strip("/").split("/")) > len(path.strip("/").split("/")):
                        children.append(recurse(l["path"], current_depth + 1))
            return {"name": unquote(path.rstrip("/").split("/")[-1]) if "/" in path.strip("/") else path, "path": path, "children": children}

        return {"tree": recurse(root, 0)}

    if name == "get_page":
        path = args["path"]
        html = _fetch(path)
        soup = BeautifulSoup(html, "html.parser")
        for tag in soup(["script", "style"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
        lines = [l for l in text.splitlines() if l.strip()]
        preview = "\n".join(lines[:200])
        return {"path": path, "html_length": len(html), "text_preview": preview, "text_total_lines": len(lines), "note": "Preview truncated to 200 lines."}

    if name == "find_pages":
        make, year, model = args["make"], args["year"], args["model"]
        keyword = args["keyword"].lower()
        max_results = args.get("max_results", 20)
        root = f"/{quote(make)}/{year}/{quote(model)}/"
        matches = []
        visited = set()
        queue = [root]
        while queue and len(matches) < max_results:
            path = queue.pop(0)
            if path in visited:
                continue
            visited.add(path)
            try:
                html = _fetch(path)
            except Exception:
                continue
            links = _parse_links(html, path)
            for l in links:
                if keyword in l["name"].lower():
                    matches.append(l)
                    if len(matches) >= max_results:
                        break
                link_depth = len(l["path"].strip("/").split("/"))
                root_depth = len(root.strip("/").split("/"))
                if link_depth > root_depth and l["path"] not in visited:
                    queue.append(l["path"])
        return {"keyword": keyword, "matches": matches, "total_found": len(matches)}

    if name == "extract_tables":
        path = args["path"]
        html = _fetch(path)
        raw_tables = _extract_tables(html)
        if args.get("map_headers", True):
            tables = _clean_table(raw_tables)
        else:
            tables = [{"rows": t} for t in raw_tables]
        return {"path": path, "tables": tables, "count": len(tables)}

    if name == "get_quick_lookups":
        make, year, model = args["make"], args["year"], args["model"]
        root = f"/{quote(make)}/{year}/{quote(model)}/"
        rd_path = f"{root}Repair%20and%20Diagnosis/"
        try:
            html = _fetch(rd_path)
            links = _parse_links(html, rd_path)
            ql_pages = [l for l in links if "quick" in l["name"].lower() or "lookup" in l["name"].lower()]
            if ql_pages:
                return {"vehicle": f"{year} {make} {model}", "source": "Repair and Diagnosis", "pages": ql_pages}
        except Exception:
            pass
        return {"vehicle": f"{year} {make} {model}", "error": "No Quick Lookups found"}

    if name == "get_fluids":
        make, year, model = args["make"], args["year"], args["model"]
        root = f"/{quote(make)}/{year}/{quote(model)}/"
        fluids_paths = [
            f"{root}Repair%20and%20Diagnosis/Quick%20Lookups/Fluids/",
            f"{root}Repair%20and%20Diagnosis/Fluids/",
        ]
        for path in fluids_paths:
            try:
                html = _fetch(path)
                tables = _extract_tables(html)
                return {"vehicle": f"{year} {make} {model}", "path": path, "tables": _clean_table(tables)}
            except Exception:
                continue
        return {"vehicle": f"{year} {make} {model}", "error": "Fluids page not found"}

    if name == "get_tire_fitment":
        make, year, model = args["make"], args["year"], args["model"]
        root = f"/{quote(make)}/{year}/{quote(model)}/"
        tire_paths = [
            f"{root}Repair%20and%20Diagnosis/Quick%20Lookups/Tire%20Fitment/",
            f"{root}Repair%20and%20Diagnosis/Tire%20Fitment/",
        ]
        for path in tire_paths:
            try:
                html = _fetch(path)
                tables = _extract_tables(html)
                return {"vehicle": f"{year} {make} {model}", "path": path, "tables": _clean_table(tables)}
            except Exception:
                continue
        return {"vehicle": f"{year} {make} {model}", "error": "Tire Fitment page not found"}

    if name == "get_specs_index":
        make, year, model = args["make"], args["year"], args["model"]
        root = f"/{quote(make)}/{year}/{quote(model)}/"
        specs_candidates = [
            f"{root}Repair%20and%20Diagnosis/Quick%20Lookups/Common%20Specs%20%26%20Procedures/Specifications%20Index/",
            f"{root}Repair%20and%20Diagnosis/Quick%20Lookups/Common%20Specs%20%26%20Procedures/",
            f"{root}General%20Information/Specifications%20Index/Common%20Specs%20%26%20Procedures/",
            f"{root}General%20Information/Specifications%20Index/",
        ]
        for path in specs_candidates:
            try:
                html = _fetch(path)
                tables = _extract_tables(html)
                links = _parse_links(html, path)
                return {"vehicle": f"{year} {make} {model}", "path": path, "tables": _clean_table(tables), "child_pages": links[:20]}
            except Exception:
                continue
        result = await _handle_tool("find_pages", {"make": make, "year": year, "model": model, "keyword": "Specifications Index", "max_results": 5})
        if result.get("matches"):
            match = result["matches"][0]
            html = _fetch(match["path"])
            tables = _extract_tables(html)
            return {"vehicle": f"{year} {make} {model}", "path": match["path"], "tables": _clean_table(tables)}
        return {"vehicle": f"{year} {make} {model}", "error": "Specifications Index not found"}

    if name == "get_battery_location":
        make, year, model = args["make"], args["year"], args["model"]
        root = f"/{quote(make)}/{year}/{quote(model)}/"
        ec_paths = [
            f"{root}Repair%20and%20Diagnosis/Quick%20Lookups/Electrical%20Component%20Locations/",
            f"{root}Repair%20and%20Diagnosis/Electrical%20Component%20Locations/",
        ]
        for path in ec_paths:
            try:
                html = _fetch(path)
                links = _parse_links(html, path)
                battery_links = [l for l in links if "battery" in l["name"].lower()]
                if battery_links:
                    battery_page = battery_links[0]["path"]
                    battery_html = _fetch(battery_page)
                    tables = _extract_tables(battery_html)
                    return {"vehicle": f"{year} {make} {model}", "path": battery_page, "tables": _clean_table(tables)}
                return {"vehicle": f"{year} {make} {model}", "path": path, "available_pages": links}
            except Exception:
                continue
        result = await _handle_tool("find_pages", {"make": make, "year": year, "model": model, "keyword": "Battery", "max_results": 10})
        return {"vehicle": f"{year} {make} {model}", "matches": result.get("matches", [])}

    if name == "get_spark_plugs":
        make, year, model = args["make"], args["year"], args["model"]
        path = _find_single_page_specs_path(make, year, model)
        if not path:
            return {"vehicle": f"{year} {make} {model}", "error": "Single Page specs not found"}
        html = _fetch(path)
        sections = _extract_text_specs(html)
        ignition = sections.get("Ignition", [])
        # Parse spark plug lines from Ignition section
        spark_data = []
        for line in ignition:
            spark_data.append(line)
        return {"vehicle": f"{year} {make} {model}", "path": path, "raw_sections": sections, "spark_plug_lines": spark_data}

    if name == "get_drive_belts":
        make, year, model = args["make"], args["year"], args["model"]
        path = _find_single_page_specs_path(make, year, model)
        if not path:
            return {"vehicle": f"{year} {make} {model}", "error": "Single Page specs not found"}
        html = _fetch(path)
        sections = _extract_text_specs(html)
        return {"vehicle": f"{year} {make} {model}", "path": path, "drive_belt_lines": sections.get("Drive Belts", [])}

    if name == "get_all_specs":
        make, year, model = args["make"], args["year"], args["model"]
        path = _find_single_page_specs_path(make, year, model)
        if not path:
            return {"vehicle": f"{year} {make} {model}", "error": "Single Page specs not found"}
        html = _fetch(path)
        sections = _extract_text_specs(html)
        return {"vehicle": f"{year} {make} {model}", "path": path, "sections": sections}

    return {"error": f"Unknown tool: {name}"}


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
