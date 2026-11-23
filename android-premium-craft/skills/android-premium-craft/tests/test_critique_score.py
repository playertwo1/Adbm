import copy
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('critique_score', ROOT / 'scripts' / 'critique_score.py')
cs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cs)


def template():
    return json.loads((ROOT / 'assets' / 'CRITIQUE_TEMPLATE.json').read_text(encoding='utf-8'))


def uniform(score, basis='visual', findings=None):
    data = template()
    for dim in cs.WEIGHTS:
        data['screens'][0]['scores'][dim] = {'score': score, 'basis': basis, 'evidence': 'shots/home.png measured'}
    data['findings'] = findings or []
    return data


class CraftScoreTests(unittest.TestCase):
    def test_weights_sum_to_100(self):
        self.assertEqual(sum(cs.WEIGHTS.values()), 100)

    def test_template_scores_low_with_low_confidence(self):
        r = cs.analyze(template())
        self.assertTrue(r['valid'])
        self.assertEqual(r['score'], 30)
        self.assertEqual(r['grade'], 'E')
        self.assertEqual(r['confidence'], 'low')
        self.assertIsNone(r['cap_reason'])  # raw is already below the P1 cap

    def test_perfect_is_premium(self):
        r = cs.analyze(uniform(4))
        self.assertEqual((r['score'], r['grade'], r['confidence']), (100, 'S', 'high'))

    def test_p0_caps_score(self):
        r = cs.analyze(uniform(4, findings=[{'severity': 'P0', 'title': 'Pay button unlabeled'}]))
        self.assertEqual(r['score'], cs.CAP_P0)
        self.assertEqual(r['grade'], 'D')
        self.assertIn('P0', r['cap_reason'])

    def test_p1_caps(self):
        one = cs.analyze(uniform(4, findings=[{'severity': 'P1', 'title': 'a'}]))
        two = cs.analyze(uniform(4, findings=[{'severity': 'P1', 'title': 'a'}, {'severity': 'P1', 'title': 'b'}]))
        self.assertEqual((one['score'], two['score']), (cs.CAP_ONE_P1, cs.CAP_MULTI_P1))

    def test_na_renormalizes(self):
        data = uniform(4)
        data['screens'][0]['scores']['motion'] = {'score': 'n/a', 'evidence': 'static screen, no motion'}
        data['screens'][0]['scores']['hierarchy']['score'] = 0
        r = cs.analyze(data)
        self.assertAlmostEqual(r['raw_score'], 100 * (100 - 8 - 14) / (100 - 8), places=1)
        self.assertIsNone(r['dimensions']['motion'])

    def test_primary_screens_count_double(self):
        data = uniform(4)
        weak = copy.deepcopy(data['screens'][0])
        weak['name'], weak['importance'] = 'Settings', 'secondary'
        for dim in cs.WEIGHTS:
            weak['scores'][dim]['score'] = 1
        data['screens'].append(weak)
        self.assertAlmostEqual(cs.analyze(data)['raw_score'], (100 * 2 + 25) / 3, places=1)

    def test_invalid_inputs_rejected(self):
        data = template()
        data['screens'][0]['scores']['color']['score'] = 5
        del data['screens'][0]['scores']['states']
        data['screens'][0]['scores']['touch']['evidence'] = 'ok'
        errors = cs.analyze(data)['errors']
        self.assertTrue(any('color' in e for e in errors))
        self.assertTrue(any('states' in e for e in errors))
        self.assertTrue(any('touch' in e for e in errors))

    def test_scorecard_and_trend(self):
        with tempfile.TemporaryDirectory() as td:
            first = cs.analyze(template())
            cs.save(first, Path(td))
            second = cs.analyze(uniform(3))
            trend = cs.save(second, Path(td))
            self.assertEqual(trend, ['30E', '75B'])
            text = cs.scorecard(second, uniform(3), trend)
            self.assertIn('Craft Score: 75/100 - B (Solid)', text)
            self.assertIn('30E -> 75B', text)


if __name__ == '__main__':
    unittest.main()
