from __future__ import annotations

import re
from collections import Counter

# This layer adapts the authored books for the digital learner experience.
# It does not replace subject vocabulary that learners genuinely need to know.
# It removes internal production notes, simplifies recurring authorial jargon,
# and updates paper-book instructions that no longer make sense on the platform.

AUDIT_COUNTS: Counter[str] = Counter()

_INTERNAL_PATTERNS = [
    re.compile(r"^I have internalized the complete conversation", re.I),
    re.compile(r"^I have internalized the complete Grade", re.I),
    re.compile(r"^Pride 2\.0 activated\.", re.I),
    re.compile(r"^I'm building Lessons?\b", re.I),
    re.compile(r"^Building Lessons?\b", re.I),
    re.compile(r"^The original draft covers Lessons?\b", re.I),
    re.compile(r"^These five lessons follow the established workshop pattern", re.I),
    re.compile(r"^\d+\. Narrative from my elevated Production Edition", re.I),
    re.compile(r"^\d+\. Structural components from the original draft", re.I),
    re.compile(r"^Term \d(?:'s|’s) thematic spine is .*original draft", re.I),
    re.compile(r"Production Protocol", re.I),
    re.compile(r"Ultimate Architectural Map", re.I),
    re.compile(r"System Architect standard", re.I),
    re.compile(r"all structural components (?:from the original draft )?(?:are )?preserved", re.I),
    re.compile(r"original Gr9 LB Complete", re.I),
    re.compile(r"^This mock exam is preserved from the original draft", re.I),
    re.compile(r"^I am continuing the build\.", re.I),
    re.compile(r"^I am continuing the build", re.I),
    re.compile(r"^Standard locked:", re.I),
    re.compile(r"^\*?I am proceeding with Lessons?\b", re.I),
]

# Exact / high-confidence phrase changes. These remove unnecessary difficulty
# without weakening the idea being taught.
_COMMON_RULES: list[tuple[str, re.Pattern[str], str]] = [
    ("affirmation_label", re.compile(r"\bThe Affirmation:\s*", re.I), "Key idea: "),
    ("paradoxical_label", re.compile(r"\bThe Paradoxical Reversal:\s*", re.I), "Here’s the tension: "),
    ("cognitive_squeeze", re.compile(r"\s*[—-]\s*Cognitive Squeeze\b|\bCognitive Squeeze\b", re.I), ""),
    ("anti_delusion_plural", re.compile(r"\bAnti-Delusion Clauses\b", re.I), "Reality Checks"),
    ("anti_delusion_clause", re.compile(r"\bAnti-Delusion Clause\b", re.I), "Reality Check"),
    ("anti_delusion", re.compile(r"\bAnti-Delusion\b", re.I), "Reality Check"),
    ("personal_pivot", re.compile(r"\bThe Personal Pivot:\s*", re.I), "Your Next Step: "),
    ("launch_clause", re.compile(r"\bLaunch Clause\b", re.I), "Launch Commitment"),
    ("shadow_management_title", re.compile(r"\bShadow Management\b", re.I), "Managing the Downside"),
    ("shadow_management", re.compile(r"\bshadow management\b", re.I), "managing the downside"),
    ("meta_habit", re.compile(r"\bmeta-habit\b", re.I), "review habit"),
    ("capstone_term", re.compile(r"\bcapstone term\b", re.I), "final term"),
    ("capstone_project", re.compile(r"\bcapstone project\b", re.I), "final project"),
    ("capstone", re.compile(r"\bcapstone\b", re.I), "final project"),
    ("reconnaissance", re.compile(r"\breconnaissance\b", re.I), "fact-finding"),
    ("comprehensive", re.compile(r"\bcomprehensive\b", re.I), "complete"),
    ("approximately", re.compile(r"\bapproximately\b", re.I), "about"),
    ("synthesizes", re.compile(r"\bsynthesizes\b", re.I), "brings together"),
    ("synthesizing", re.compile(r"\bsynthesizing\b", re.I), "bringing together"),
    ("synthesized", re.compile(r"\bsynthesized\b", re.I), "combined"),
    ("foundational", re.compile(r"\bfoundational\b", re.I), "basic"),
    ("higher_order", re.compile(r"\bhigher-order\b", re.I), "advanced"),
    ("distinction", re.compile(r"\bdistinction\b", re.I), "difference"),
    ("consciously", re.compile(r"\bconsciously\b", re.I), "on purpose"),
    ("constraints", re.compile(r"\bconstraints\b", re.I), "limits"),
    ("preliminary", re.compile(r"\bpreliminary\b", re.I), "first"),
    ("significant", re.compile(r"\bsignificant\b", re.I), "important"),
]

# Lower grades get a slightly stronger plain-language pass. These are general
# words, not essential commerce terminology.
_GRADE_8_9_RULES: list[tuple[str, re.Pattern[str], str]] = [
    ("competencies_plain", re.compile(r"\bcompetencies\b", re.I), "skills"),
    ("circumstances_plain", re.compile(r"\bcircumstances\b", re.I), "situation"),
]

_DIGITAL_RULES: list[tuple[str, re.Pattern[str], str]] = [
    ("how_book_supports", re.compile(r"HOW THIS BOOK SUPPORTS", re.I), "HOW APPLIED COMMERCE SUPPORTS"),
    ("how_to_use_book", re.compile(r"HOW TO USE THIS BOOK", re.I), "HOW TO USE APPLIED COMMERCE"),
    ("this_book_develops", re.compile(r"\bThis book develops\b", re.I), "Applied Commerce develops"),
    ("work_through_book", re.compile(r"\bAs you work through this book\b", re.I), "As you work through Applied Commerce"),
    ("book_full_stories", re.compile(r"\bThis book is full of stories\b", re.I), "Applied Commerce is full of stories"),
    ("opened_this_book", re.compile(r"\bopened this book\b", re.I), "started Applied Commerce"),
    ("in_this_book", re.compile(r"\bin this book\b", re.I), "in this grade"),
    ("through_your_book", re.compile(r"\bthrough your book\b", re.I), "through your lessons"),
    ("book_is_yours", re.compile(r"\bThis book is yours\. Write in it\. Question it\. Talk back to it\.\b", re.I),
     "This learning journey is yours. Use it. Question it. Talk back to it."),
    ("save_piece", re.compile(r"\bSave this piece of work\. It is evidence of your growth\.\b", re.I),
     "This work will be kept as evidence of your growth."),
]

_CULMINATION_SENTENCE_RULES: list[tuple[str, re.Pattern[str], str]] = [
    ("culmination_sentence", re.compile(r"\bThis is the culmination\.\b", re.I), "This brings everything together."),
    ("culmination_of_learning", re.compile(r"\bThis is the culmination of everything you have learned\b", re.I),
     "This brings together everything you have learned"),
    ("culmination_generic", re.compile(r"\bculmination\b", re.I), "final stage"),
]


def is_internal_editorial_note(text: str) -> bool:
    value = text.strip()
    for pattern in _INTERNAL_PATTERNS:
        if pattern.search(value):
            AUDIT_COUNTS["removed_internal_editorial_note"] += 1
            return True
    return False


def _apply_rules(text: str, rules: list[tuple[str, re.Pattern[str], str]]) -> str:
    result = text
    for name, pattern, replacement in rules:
        result, count = pattern.subn(replacement, result)
        if count:
            AUDIT_COUNTS[name] += count
    return result


def adapt_text(text: str, grade: int) -> str:
    result = text

    # DBE Basic Education Competency Framework is a formal title; keep it.
    formal_competency_title = "DBE Basic Education Competency Framework"
    placeholder = "__DBE_COMPETENCY_FRAMEWORK__"
    result = result.replace(formal_competency_title, placeholder)

    result = _apply_rules(result, _COMMON_RULES)
    result = _apply_rules(result, _CULMINATION_SENTENCE_RULES)
    result = _apply_rules(result, _DIGITAL_RULES)
    if grade <= 9:
        result = _apply_rules(result, _GRADE_8_9_RULES)

    result = result.replace(placeholder, formal_competency_title)

    # Smooth grammar introduced by plain-language substitutions.
    result = re.sub(r"\b(an) Reality Check\b", "a Reality Check", result, flags=re.I)
    result = re.sub(r"Here’s the tension:\s*(?:But\s+)?here is the tension:\s*", "Here’s the tension: ", result, flags=re.I)
    result = re.sub(r"Here’s the tension:\s*But\s+", "Here’s the tension: ", result, flags=re.I)
    result = re.sub(r"Here’s the tension:\s*here is [^:]{1,60}:\s*", "Here’s the tension: ", result, flags=re.I)

    # Clean punctuation left after removing an unnecessary checkpoint label.
    result = re.sub(r"\(\s*([^()]*)\s+[—-]\s*\)", r"(\1)", result)
    result = re.sub(r"\s{2,}", " ", result).strip()
    return result


def reset_audit_counts() -> None:
    AUDIT_COUNTS.clear()


def audit_summary() -> dict[str, int]:
    return dict(sorted(AUDIT_COUNTS.items()))