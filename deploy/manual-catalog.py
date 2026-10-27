#!/usr/bin/env python3
"""Resumable source-manifest catalog. These are entry points, not a leaf-page census."""
import hashlib,json,os,pathlib
root=pathlib.Path('/srv/alloem-manuals')
assert os.path.ismount(root)
inputs=[root/'source'/name/'index.json' for name in ['charm','lemon']]
fingerprint=hashlib.sha256(b''.join(hashlib.sha256(path.read_bytes()).digest() for path in inputs)).hexdigest()
directory=root/'catalog'/fingerprint[:20];directory.mkdir(exist_ok=True)
statefile=directory/'state.json'
state=json.loads(statefile.read_text()) if statefile.exists() else {'source':0,'next_vehicle':0,'bytes':0,'records':0,'kind':'vehicle_entrypoints','fingerprint':fingerprint}
if state.get('complete'):print(json.dumps(state));raise SystemExit(0)
output=directory/'vehicles.jsonl'
with output.open('a+b') as stream:
    stream.truncate(state['bytes']);stream.seek(0,2)
    for source_index in range(state['source'],len(inputs)):
        vehicles=json.loads(inputs[source_index].read_text())['vehicles']
        start=state['next_vehicle'] if source_index==state['source'] else 0
        for i in range(start,len(vehicles)):
            vehicle=vehicles[i];uri=vehicle.get('uriPath','')
            if isinstance(uri,str) and uri.startswith('/'):
                row={'path':'/manual'+uri.rstrip('/'),'corpus':inputs[source_index].parent.name,'make':vehicle.get('make'),'model':vehicle.get('model')}
                stream.write((json.dumps(row,ensure_ascii=False,separators=(',',':'))+'\n').encode());state['records']+=1
            if (i+1)%1000==0 or i+1==len(vehicles):
                stream.flush();os.fsync(stream.fileno())
                state.update(source=source_index,next_vehicle=i+1,bytes=stream.tell())
                temporary=statefile.with_suffix('.tmp');temporary.write_text(json.dumps(state));temporary.replace(statefile)
        del vehicles
    state['complete']=True
    statefile.write_text(json.dumps(state,indent=2))
pointer=root/'catalog/current.json';temporary=pointer.with_suffix('.tmp')
temporary.write_text(json.dumps({'directory':str(directory),**state},indent=2));temporary.replace(pointer)
print(json.dumps(state))
