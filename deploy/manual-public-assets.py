#!/usr/bin/env python3
"""Keep immutable build assets and the existing publisher-managed ads.txt reachable without Next."""
import hashlib,json,pathlib,shutil
app=pathlib.Path('/root/spotonauto.com')
target=pathlib.Path('/data/alloem-public-assets');target.mkdir(mode=0o755,exist_ok=True)
manual=pathlib.Path('/opt/alloemmanuals/manual-current')
roots=[app]
if manual.exists():roots.append(manual.resolve())
statepath=target/'state.json';state=json.loads(statepath.read_text()) if statepath.exists() else {}
builds=[(str(root),(root/'.next/BUILD_ID').read_text().strip()) for root in roots]
if state.get('builds')!=[list(row) for row in builds]:
    for root in roots:
        base=root/'.next/static'
        for source in base.rglob('*'):
            if not source.is_file():continue
            destination=target/'static'/source.relative_to(base)
            if destination.exists():
                assert hashlib.sha256(source.read_bytes()).digest()==hashlib.sha256(destination.read_bytes()).digest(),'Static asset name collision'
            else:
                destination.parent.mkdir(mode=0o755,parents=True,exist_ok=True);shutil.copy2(source,destination);destination.chmod(0o644)
    state['builds']=builds
ads=(app/'public/ads.txt').read_bytes()
assert b'managerdomain=mediavine.com' in ads and len(ads)>4000,'Refusing to replace the last valid publisher file'
digest=hashlib.sha256(ads).hexdigest()
if digest!=state.get('ads_sha256'):
    temporary=target/'ads.txt.tmp';temporary.write_bytes(ads);temporary.chmod(0o644);temporary.replace(target/'ads.txt')
    state['ads_sha256']=digest
statepath.write_text(json.dumps(state,indent=2))
print(json.dumps({'builds':builds,'ads_sha256':digest}))
