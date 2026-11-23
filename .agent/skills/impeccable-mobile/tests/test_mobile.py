import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from PIL import Image

SCRIPT=Path(__file__).resolve().parents[1]/'scripts'/'mobile.py'
spec=importlib.util.spec_from_file_location('mobile_tool',SCRIPT)
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class TestMobileVisual(unittest.TestCase):
    def test_identical(self):
        with tempfile.TemporaryDirectory() as td:
            d=Path(td); Image.new('RGB',(40,40),(30,30,30)).save(d/'a.png')
            Image.new('RGB',(40,40),(30,30,30)).save(d/'b.png')
            r=m.compute_visual_diff(d/'a.png',d/'b.png',d/'out')
            self.assertEqual(r['changed_percent'],0)
            self.assertTrue((d/'out'/'highlighted.png').exists())
            self.assertTrue((d/'out'/'comparison.json').exists())

    def test_changed_region_and_ignore(self):
        with tempfile.TemporaryDirectory() as td:
            d=Path(td)
            Image.new('RGB',(10,10),(0,0,0)).save(d/'a.png')
            im=Image.new('RGB',(10,10),(0,0,0)); im.putpixel((3,4),(255,0,0));im.save(d/'b.png')
            r=m.compute_visual_diff(d/'a.png',d/'b.png',d/'out')
            self.assertEqual(r['changed_pixels'],1)
            r=m.compute_visual_diff(d/'a.png',d/'b.png',d/'out2', ignore_regions=[(3,4,1,1)])
            self.assertEqual(r['changed_pixels'],0)

    def test_incompatible_sizes(self):
        with tempfile.TemporaryDirectory() as td:
            d=Path(td);Image.new('RGB',(10,10)).save(d/'a.png');Image.new('RGB',(20,10)).save(d/'b.png')
            r=m.compute_visual_diff(d/'a.png',d/'b.png',d/'out')
            self.assertFalse(r['comparable'])

    def test_safe_name_and_region(self):
        self.assertEqual(m.safe_name('agenda-1'),'agenda-1')
        with self.assertRaises(ValueError):m.safe_name('../agenda')
        self.assertEqual(m.parse_region('1,2,3,4'),(1,2,3,4))

if __name__=='__main__':unittest.main()
