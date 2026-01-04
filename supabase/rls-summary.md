# RLS Quick Reference Matrix

## Permission Matrix by Role

### Anonymous (No Auth)
| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| users | ❌ | ❌ | ❌ | ❌ |
| analyses | ❌ | ❌ | ❌ | ❌ |
| uploaded_documents | ❌ | ❌ | ❌ | ❌ |
| analysis_results | ❌ | ❌ | ❌ | ❌ |

### Authenticated User (Anon Key + JWT)
| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| users | ✅ Own only | ❌ | ❌ | ❌ |
| analyses | ✅ Own only | ✅ Own only | ✅ Own only | ❌ |
| uploaded_documents | ✅ Own only | ❌ | ❌ | ❌ |
| analysis_results | ✅ Own only | ❌ | ❌ | ❌ |

### Service Role (Backend Only)
| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| users | ✅ All | ✅ All | ✅ All | ✅ All |
| analyses | ✅ All | ✅ All | ✅ All | ✅ All |
| uploaded_documents | ✅ All | ✅ All | ✅ All | ✅ All |
| analysis_results | ✅ All | ✅ All | ❌ Trigger blocks | ✅ All |

---

## Critical Notes

1. **"Own only"** means `auth.uid()` must match `user_id` or ownership chain via join
2. **analysis_results UPDATE is blocked by trigger** even for service role
3. **No DELETE policies exist for analyses** - they are permanent audit records
4. **users table has no INSERT policy** - creation happens via trigger on auth.users
