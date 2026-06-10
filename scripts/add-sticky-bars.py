#!/usr/bin/env python3
"""Batch-add StickyAffiliateBar to all maintenance pages."""

from pathlib import Path

BASE = Path('/home/lyndon/projects/spotonauto.com/src/app/maintenance/[year]/[make]/[model]')

INTENTS = {
    'battery-location': ('Battery Replacement', '{year} {displayMake} {displayModel} automotive battery'),
    'brake-fluid-type': ('Brake Fluid', '{year} {displayMake} {displayModel} brake fluid DOT'),
    'coolant-type': ('Coolant', '{year} {displayMake} {displayModel} coolant antifreeze'),
    'fluid-capacity': ('Fluid Service', '{year} {displayMake} {displayModel} oil coolant transmission fluid'),
    'headlight-bulb': ('Headlight Bulbs', '{year} {displayMake} {displayModel} headlight bulbs LED halogen'),
    'oil-type': ('Oil Change', '{year} {displayMake} {displayModel} {oil.oilType} oil filter'),
    'serpentine-belt': ('Serpentine Belt', '{year} {displayMake} {displayModel} serpentine belt tensioner'),
    'spark-plug-type': ('Spark Plugs', '{year} {displayMake} {displayModel} iridium spark plugs'),
    'tire-size': ('Tires', '{year} {displayMake} {displayModel} tires OEM'),
    'transmission-fluid-type': ('Transmission Fluid', '{year} {displayMake} {displayModel} transmission fluid ATF'),
    'wiper-blade-size': ('Wiper Blades', '{year} {displayMake} {displayModel} wiper blades windshield'),
}

IMPORT_LINE = 'import StickyAffiliateBar from "@/components/StickyAffiliateBar";\n'


def add_to_page(page_path: Path, page_type: str):
    text = page_path.read_text()

    if 'StickyAffiliateBar' in text:
        print(f'SKIP (already has): {page_type}')
        return

    # Add import after last import line
    lines = text.splitlines(keepends=True)
    last_import_idx = -1
    for i, line in enumerate(lines):
        if line.lstrip().startswith('import '):
            last_import_idx = i

    if last_import_idx >= 0:
        lines.insert(last_import_idx + 1, IMPORT_LINE)
        text = ''.join(lines)
    else:
        text = IMPORT_LINE + text

    intent, query_template = INTENTS[page_type]
    subtag = 'maint-' + page_type.replace('-', '')

    # Build JSX; use plain string concatenation to avoid f-string/backtick issues
    vehicle_expr = '{year} ${displayMake} ${displayModel}'
    sticky_jsx = (
        '\n        <StickyAffiliateBar\n'
        '          vehicle={`' + vehicle_expr + '`}\n'
        '          intent="' + intent + '"\n'
        '          query={`' + query_template + '`}\n'
        '          subtag="' + subtag + '"\n'
        '          variant="mixed"\n'
        '        />'
    )

    # Insert before the final closing pattern
    closing = '      </div>\n    </>\n  );\n}'
    if closing not in text:
        print(f'WARN: closing pattern not found for {page_type}')
        return

    text = text.replace(closing, sticky_jsx + '\n' + closing, 1)
    page_path.write_text(text)
    print(f'UPDATED: {page_type}')


def main():
    for page_type in INTENTS:
        page_path = BASE / page_type / 'page.tsx'
        if not page_path.exists():
            print(f'MISSING: {page_path}')
            continue
        add_to_page(page_path, page_type)


if __name__ == '__main__':
    main()
