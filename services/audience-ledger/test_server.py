import base64
import datetime as dt
import http.client
import json
import os
import tempfile
import threading
import unittest
import uuid
from server import Ledger, Server, ET, validate, safe_path

def event(kind='page', **changes):
    result = {'v':1, 'event_id':str(uuid.uuid4()), 'run_id':str(uuid.uuid4()),
              'view_id':str(uuid.uuid4()), 'type':kind, 'pathname':'/wiring', 'nav':'initial'}
    result.update(changes)
    return result

class LedgerTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.ledger = Ledger(os.path.join(self.directory.name,'events.db'))
        self.server = Server(('127.0.0.1',0),self.ledger,'test-secret')
        self.thread = threading.Thread(target=self.server.serve_forever,daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.directory.cleanup()

    def request(self,path='/_audience/events',body=None,headers=None,method=None):
        conn = http.client.HTTPConnection('127.0.0.1',self.server.server_port,timeout=3)
        defaults = {'Origin':'https://alloemmanuals.com','Content-Type':'application/json','CF-IPCountry':'US','User-Agent':'Chrome Macintosh'}
        defaults.update(headers or {})
        data = None if body is None else json.dumps(body)
        conn.request(method or ('POST' if body is not None else 'GET'),path,data,defaults)
        response = conn.getresponse()
        result = response.status,response.read()
        conn.close()
        return result

    def post(self,events,consent='regional_aggregate',**kw):
        return self.request(body={'v':1,'consent':consent,'events':events},**kw)

    def report(self):
        today=dt.datetime.now(ET).date()
        return self.ledger.report(today,today)

    def test_health_and_policy_do_not_create_events(self):
        self.assertEqual(self.request('/_audience/health')[0],200)
        status,payload=self.request('/_audience/policy',headers={'CF-IPCountry':'DE'})
        self.assertEqual(status,200)
        self.assertTrue(json.loads(payload)['requires_publisher_consent'])
        self.assertEqual(self.report()['totals']['pageviews'],0)

    def test_post_policy_is_origin_checked_and_nonpersisting(self):
        status,data=self.request('/_audience/policy',body={},headers={'CF-IPCountry':'US'})
        self.assertEqual(status,200)
        self.assertTrue(json.loads(data)['regional_aggregate_allowed'])
        status,data=self.request('/_audience/policy',body={},headers={'CF-IPCountry':'DE','Sec-GPC':'1'})
        self.assertEqual(status,200)
        self.assertTrue(json.loads(data)['opted_out'])
        self.assertFalse(json.loads(data)['regional_aggregate_allowed'])
        self.assertEqual(self.request('/_audience/policy',body={},headers={'Origin':'https://evil.invalid'})[0],403)
        self.assertEqual(self.request('/_audience/policy',body={},headers={'Sec-Fetch-Site':'cross-site'})[0],403)
        self.assertEqual(self.report()['totals']['pageviews'],0)

    def test_origin_and_fetch_metadata(self):
        self.assertEqual(self.post([event()],headers={'Origin':'https://evil.invalid'})[0],403)
        self.assertEqual(self.post([event()],headers={'Sec-Fetch-Site':'cross-site'})[0],403)
        self.assertEqual(self.report()['totals']['pageviews'],0)

    def test_regional_policy_and_optouts(self):
        for header in ({'DNT':'1'},{'Sec-GPC':'1'},{'CF-IPCountry':'DE'},{'CF-IPCountry':'unknown'}):
            self.assertEqual(self.post([event()],headers=header)[0],204)
        self.assertEqual(self.report()['totals']['pageviews'],0)
        self.assertEqual(self.post([event()],consent='publisher_granted',headers={'CF-IPCountry':'DE'})[0],204)
        self.assertEqual(self.report()['totals']['pageviews'],1)

    def test_idempotent_event_and_anchor(self):
        page=event()
        self.assertEqual(self.post([page,page])[0],204)
        duplicate=dict(page,event_id=str(uuid.uuid4()))
        self.assertEqual(self.post([duplicate])[0],204)
        self.assertEqual(self.report()['totals']['pageviews'],1)

    def test_out_of_order_evidence_anchors_same_view(self):
        page=event()
        evidence=dict(page,event_id=str(uuid.uuid4()),type='evidence',visible_ms=15000,interactions=1)
        self.post([evidence])
        self.assertEqual(self.report()['totals']['pageviews'],0)
        self.post([page])
        totals=self.report()['totals']
        self.assertEqual(totals['human_consistent_views'],1)
        self.assertEqual(totals['browser_runs'],1)

    def test_automation_evidence_wins(self):
        page=event(visible_ms=15000,interactions=1)
        evidence=dict(page,event_id=str(uuid.uuid4()),type='evidence',webdriver=True)
        self.post([page,evidence])
        self.assertEqual(self.report()['totals']['automation_indicated_views'],1)
        self.assertEqual(self.report()['totals']['human_consistent_views'],0)

    def test_declared_bot_and_affiliate(self):
        page=event()
        affiliate=dict(page,event_id=str(uuid.uuid4()),type='affiliate',dest_host='amazon.com',affiliate_tag='aiautorepair-20')
        self.post([page,affiliate],headers={'User-Agent':'GPTBot/1.0'})
        result=self.report()['totals']
        self.assertEqual(result['automation_indicated_views'],1)
        self.assertEqual(result['affiliate_clicks'],1)

    def test_validation_and_privacy(self):
        for changes in ({'event_id':'bad'},{'visible_ms':-1},{'webdriver':'false'},{'dest_host':'evil.invalid'},{'ip':'secret'},{'pathname':'/account/user'},{'pathname':'/mail/a%40example.com'},{'pathname':'/x/'+('a'*1001)}):
            self.assertEqual(self.post([event(**changes)])[0],400,changes)
        self.assertEqual(safe_path('/wiring?email=secret@example.com'),'/wiring')
        self.assertEqual(self.post([event()]*17)[0],400)

    def test_auth_dates_and_dashboard(self):
        self.assertEqual(self.request('/_audience/report')[0],401)
        auth={'Authorization':'Basic '+base64.b64encode(b'lyndon:test-secret').decode()}
        self.assertEqual(self.request('/_audience/report?days=32',headers=auth)[0],400)
        self.assertEqual(self.request('/_audience/report?start=2026-10-20&end=2026-10-01',headers=auth)[0],400)
        status,data=self.request('/_audience/report?days=1',headers=auth)
        self.assertEqual(status,200)
        self.assertEqual(json.loads(data)['timezone'],'America/New_York')
        self.assertEqual(self.request('/_audience/dashboard',headers=auth)[0],200)
        self.server.admin_password=''
        self.assertEqual(self.request('/_audience/report',headers=auth)[0],503)

    def test_et_date_boundaries(self):
        page=validate(event())
        self.ledger.insert([page],{'CF-IPCountry':'US'},'regional_aggregate')
        instant=dt.datetime(2026,10,16,0,30,tzinfo=dt.timezone.utc).timestamp()
        with self.ledger.connection() as db:
            db.execute('UPDATE events SET received=?',(instant,))
        day=dt.date(2026,10,15)
        self.assertEqual(self.ledger.report(day,day)['totals']['pageviews'],1)
        self.assertEqual(self.ledger.report(day+dt.timedelta(days=1),day+dt.timedelta(days=1))['totals']['pageviews'],0)

    def test_ad_observations_deduplicate_and_require_mediavine(self):
        page=event()
        ad=dict(page,event_id=str(uuid.uuid4()),type='ad',ad_kind='rendered',unit='mediavine')
        self.assertEqual(self.post([page,ad,ad])[0],204)
        self.assertEqual(self.report()['totals']['observed_ad_rendered'],1)
        self.assertEqual(self.post([dict(ad,event_id=str(uuid.uuid4()),unit='arbitrary-slot-id')])[0],400)

    def test_other_path_evidence_cannot_upgrade_page(self):
        page=event()
        evidence=dict(page,event_id=str(uuid.uuid4()),type='evidence',pathname='/codes',visible_ms=20000,interactions=1)
        self.post([page,evidence])
        self.assertEqual(self.report()['totals']['browser_unconfirmed_views'],1)

    def test_retention_cleanup(self):
        self.post([event()])
        with self.ledger.connection() as db:
            db.execute('UPDATE events SET received=0')
        self.ledger.last_cleanup=0
        self.ledger.cleanup()
        with self.ledger.connection() as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM events').fetchone()[0],0)

    def test_idle_service_maintenance_cleans_expired_rows(self):
        self.post([event()])
        with self.ledger.connection() as db:
            db.execute('UPDATE events SET received=0')
        self.ledger.last_cleanup=0
        self.server.service_actions()
        with self.ledger.connection() as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM events').fetchone()[0],0)

if __name__=='__main__':
    unittest.main()
