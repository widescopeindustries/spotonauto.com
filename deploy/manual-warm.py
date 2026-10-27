#!/usr/bin/env python3
"""Small demand-based warm batches; no JS execution and no search submissions."""
import collections,json,os,pathlib,time,urllib.parse,urllib.request
root=pathlib.Path('/srv/alloem-manuals')
assert os.path.ismount(root)
paths=collections.Counter({'/manual':10000,'/manual/Honda':9000,'/manual/Chevrolet':8000,'/manual/Ford':7000,'/manual/Toyota':6000})
log=root/'logs/access.jsonl'
if log.exists():
    with log.open('rb') as stream:
        stream.seek(max(0,log.stat().st_size-8*1024*1024))
        if stream.tell():stream.readline()
        for line in stream:
            try:row=json.loads(line)
            except (ValueError,UnicodeDecodeError):continue
            uri=row.get('uri','')
            if row.get('uri_encoding')=='raw' and row.get('status')==200 and uri.startswith('/manual/') and len(uri)<6000 and '?' not in uri:paths[uri]+=1
statepath=root/'catalog/warm-state.json'
state=json.loads(statepath.read_text()) if statepath.exists() else {'next':0}
selected=paths.most_common(200)
for i in range(state['next'],len(selected)):
    with urllib.request.urlopen('http://127.0.0.1:3020/_health',timeout=2) as response:health=json.load(response)
    available=int(next(line.split()[1] for line in pathlib.Path('/proc/meminfo').read_text().splitlines() if line.startswith('MemAvailable:')))
    if health['queued'] or health['active']>4 or available<8*1024*1024 or os.getloadavg()[0]>12:
        statepath.write_text(json.dumps({'next':i,'reason':'foreground_budget'}));raise SystemExit(0)
    path=urllib.parse.quote(selected[i][0],safe='/%(),:;&=+-_.~!$@')
    try:
        with urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:3022'+path,headers={'Host':'alloemmanuals.com','Accept':'text/html','User-Agent':'AllOEMManuals-Internal-Warmer/1.0'}),timeout=10) as response:
            while response.read(65536):pass
    except Exception:
        statepath.write_text(json.dumps({'next':i,'reason':'temporary_failure'}));raise SystemExit(0)
    statepath.write_text(json.dumps({'next':i+1}));time.sleep(1)
statepath.write_text(json.dumps({'next':0,'completed':len(selected),'at':time.time()}))
