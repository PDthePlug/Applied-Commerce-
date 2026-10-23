# Standalone print margins

The first 64-plan candidate passes all selected integrated fields, controls, navigation, responsive and new-lesson persistence checks. The standalone PDF check then finds an empty fourth page in Lesson 55: 13 of 14 selected exports pass, with 84 pages including the empty page. This is a failed acceptance check, retained under `initial/`, not counted as a completed batch.

The standalone workspace inherits the institutional report shell’s 12 mm print padding while its named teacher page already supplies 12 mm page margins. The extra bottom padding can spill into a blank final page. Teacher fallback printing now removes that duplicate shell padding only when a standalone teaching plan is present. Page margins remain; ordinary institutional report padding and screen layouts remain unchanged. Integrated teaching print selection is unaffected.

A local synthetic browser regression checks the actual stylesheet cascade: standalone teacher shell has zero extra padding, all teaching content remains visible, and ordinary institution reports retain 12 mm padding. This is a local presentation check, not genuine authentication. Final hosted fallback PDF, field completeness, role and three-period checks remain pending the corrected normal build. No guide field, source, response identity, key or Auth/RLS change is involved.
