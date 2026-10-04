import unittest
from block_identity import identify_blocks

class Identities(unittest.TestCase):
    def test_insert_and_move(self):
        activity={'kind':'text','type':'activity','text':'Activity 1: Test'}
        prompt={'kind':'text','type':'paragraph','text':'My action: ______'}
        original=identify_blocks([dict(activity),dict(prompt)])[1]['id']
        changed=identify_blocks([dict(activity),{'kind':'text','type':'paragraph','text':'Extra explanation'},dict(prompt)])[2]['id']
        self.assertEqual(original,changed)
        revised=identify_blocks([dict(activity),{**prompt,'text':'My revised plan: ______'}])[1]['id']
        self.assertNotEqual(original,revised)
    def test_repeated_questions_in_different_tasks(self):
        b=identify_blocks([{'kind':'text','type':'activity','text':'Activity 1'}, {'kind':'text','type':'paragraph','text':'What happened?'},{'kind':'text','type':'activity','text':'Activity 2'},{'kind':'text','type':'paragraph','text':'What happened?'}])
        self.assertNotEqual(b[1]['id'],b[3]['id'])

if __name__=='__main__':unittest.main()
