# Share Tracking and Leaderboard Plan

## Overview
This document outlines the plan to track playlist and play button shares and build a leaderboard system to showcase the most popular content.

## Current State
- ✅ Share pages exist at `/share/[id]` for play buttons
- ✅ Playlists can include share context via query params (`?playlistId=X&startIndex=Y`)
- ✅ Share metadata includes Open Graph and Farcaster miniapp tags
- ❌ **No tracking**: We currently have NO database tables or tracking for when shares occur
- ❌ **No analytics**: We don't know which content is being shared most

## Goals
1. Track when play buttons and playlists are shared
2. Track view counts on shared content
3. Build leaderboard views showing:
   - Most shared play buttons
   - Most shared playlists
   - Most viewed shared content
   - Top creators/users by shares
4. Provide analytics for users to see their own share performance

## Database Schema Changes

### New Table: `shares`
```sql
CREATE TABLE IF NOT EXISTS shares (
  id SERIAL PRIMARY KEY,
  share_type VARCHAR(50) NOT NULL, -- 'play_button' or 'playlist'
  content_id VARCHAR(255) NOT NULL, -- play_button.id or playlist.id
  user_fid BIGINT NOT NULL, -- creator/owner of the shared content
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  share_context JSONB, -- additional metadata (platform, referrer, etc.)
  FOREIGN KEY (user_fid) REFERENCES users(fid) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shares_content ON shares(share_type, content_id);
CREATE INDEX IF NOT EXISTS idx_shares_user ON shares(user_fid);
CREATE INDEX IF NOT EXISTS idx_shares_created ON shares(shared_at DESC);
```

### New Table: `share_views`
```sql
CREATE TABLE IF NOT EXISTS share_views (
  id SERIAL PRIMARY KEY,
  share_type VARCHAR(50) NOT NULL, -- 'play_button' or 'playlist'
  content_id VARCHAR(255) NOT NULL, -- play_button.id or playlist.id
  viewer_fid BIGINT, -- NULL for anonymous views
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  view_context JSONB, -- additional metadata (user agent, location, etc.)
  UNIQUE(share_type, content_id, viewer_fid, viewed_at) -- prevent spam
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_share_views_content ON share_views(share_type, content_id);
CREATE INDEX IF NOT EXISTS idx_share_views_user ON share_views(viewer_fid);
CREATE INDEX IF NOT EXISTS idx_share_views_created ON share_views(viewed_at DESC);
```

### Optional: Materialized Views for Leaderboard Performance
```sql
-- Aggregated share counts (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS share_leaderboard AS
SELECT 
  share_type,
  content_id,
  user_fid,
  COUNT(*) as share_count,
  MAX(shared_at) as last_shared
FROM shares
GROUP BY share_type, content_id, user_fid
ORDER BY share_count DESC;

-- Aggregated view counts
CREATE MATERIALIZED VIEW IF NOT EXISTS view_leaderboard AS
SELECT 
  share_type,
  content_id,
  COUNT(*) as view_count,
  COUNT(DISTINCT viewer_fid) as unique_viewers
FROM share_views
GROUP BY share_type, content_id
ORDER BY view_count DESC;
```

## Implementation Steps

### Phase 1: Database Setup
1. Create migration script `scripts/add-share-tracking.mjs`
2. Add the `shares` and `share_views` tables
3. Run migration on production database
4. Test with sample data

### Phase 2: Share Tracking Implementation
1. Create API endpoint `POST /api/shares/track`
   - Accepts: `{ shareType, contentId, userFid, context? }`
   - Records share event in database
   - Returns: `{ success: boolean }`

2. Add share tracking to share button components
   - Integrate with existing share functionality
   - Call tracking API when share button is clicked
   - Handle errors gracefully (don't block sharing)

3. Track share button clicks in these locations:
   - `components/play-button-card.tsx` (individual play button shares)
   - `app/playlists/page.tsx` (playlist shares)
   - Any other share UI components

### Phase 3: View Tracking Implementation
1. Create API endpoint `POST /api/shares/view`
   - Accepts: `{ shareType, contentId, viewerFid?, context? }`
   - Records view event in database
   - Use rate limiting to prevent spam

2. Add view tracking to share pages
   - Track views on `/share/[id]` page load
   - Include referrer and user agent data
   - Debounce/throttle to prevent double-counting

3. Privacy considerations:
   - Make viewer FID optional (support anonymous views)
   - Don't track detailed user information
   - Consider GDPR compliance

### Phase 4: Leaderboard UI
1. Create API endpoints for leaderboard data:
   - `GET /api/leaderboard/shares?type=play_button|playlist&limit=50`
   - `GET /api/leaderboard/views?type=play_button|playlist&limit=50`
   - `GET /api/leaderboard/users?limit=50` (top creators)
   - `GET /api/leaderboard/user/:fid` (individual user stats)

2. Create leaderboard page `/leaderboard` or `/explore`
   - Tabs for different leaderboard types
   - Show top 50/100 entries
   - Include user avatars, content info, counts
   - Link to the actual content

3. Add user analytics dashboard
   - Show user's own share and view stats
   - Compare to overall averages
   - Growth charts over time

### Phase 5: Optimizations
1. Implement caching:
   - Cache leaderboard queries (5-15 minute TTL)
   - Use Redis or similar for high-traffic scenarios
   
2. Consider using materialized views:
   - Refresh every hour or on-demand
   - Improves query performance for large datasets
   
3. Add pagination for leaderboards
   - Support viewing beyond top 50
   - Add search/filter capabilities

## API Endpoints Summary

### Tracking Endpoints
- `POST /api/shares/track` - Record a share event
- `POST /api/shares/view` - Record a view event

### Analytics Endpoints
- `GET /api/leaderboard/shares` - Get most shared content
- `GET /api/leaderboard/views` - Get most viewed content
- `GET /api/leaderboard/users` - Get top creators by shares
- `GET /api/leaderboard/user/:fid` - Get user-specific stats
- `GET /api/analytics/summary` - Get overall platform stats

## UI Components Needed

### Leaderboard Components
- `LeaderboardTable` - Reusable table component
- `LeaderboardCard` - Card view for content
- `UserStats` - User statistics display
- `TrendingBadge` - Badge for trending content

### Integration Points
- Add "view count" or "share count" badges to existing cards
- Add leaderboard link to navigation
- Add user stats to profile/settings page

## Data Privacy & Security

### Privacy Considerations
- Anonymous views should be supported
- Don't expose individual viewer lists
- Aggregate data only for public display
- Users can see who shared their content (optional)

### Security Measures
- Rate limiting on tracking endpoints (prevent spam)
- Validate content IDs exist before recording
- CSRF protection on POST endpoints
- Consider bot detection for view tracking

### Rate Limits (Suggested)
- Share tracking: 10 shares per user per minute
- View tracking: 1 view per user per content per hour
- Leaderboard API: 60 requests per minute per IP

## Metrics to Track

### Content Metrics
- Total shares per play button/playlist
- Total views per play button/playlist
- Share-to-view ratio
- Trending score (shares + views weighted by time)

### User Metrics
- Total shares by user (as creator)
- Total views on user's content
- Average shares per content
- User engagement score

### Platform Metrics
- Total shares across platform
- Total views across platform
- Daily/weekly/monthly growth
- Top performing content types

## Future Enhancements

### Phase 6+ (Future)
1. **Social Features**
   - Show "shared by X users" on content
   - Social proof indicators
   - Sharing milestones and achievements

2. **Advanced Analytics**
   - Time-series analysis
   - Geographic distribution (if tracking location)
   - Platform/source breakdown (Twitter, Farcaster, etc.)
   - Cohort analysis

3. **Gamification**
   - Badges for share milestones
   - Creator rankings and tiers
   - Viral content detection and notifications

4. **Recommendations**
   - "Trending now" section
   - Personalized recommendations based on views
   - Similar content suggestions

## Testing Plan

### Unit Tests
- Test share tracking API endpoint
- Test view tracking API endpoint
- Test leaderboard query logic
- Test rate limiting

### Integration Tests
- Test full share flow (click → track → display)
- Test view tracking on share page load
- Test leaderboard data accuracy
- Test anonymous vs authenticated tracking

### Performance Tests
- Load test tracking endpoints
- Query performance on large datasets
- Cache effectiveness testing

## Timeline Estimate

- **Phase 1**: Database setup - 2-4 hours
- **Phase 2**: Share tracking - 4-6 hours
- **Phase 3**: View tracking - 4-6 hours
- **Phase 4**: Leaderboard UI - 8-12 hours
- **Phase 5**: Optimizations - 4-6 hours

**Total**: ~22-34 hours of development

## Open Questions

1. Should we track shares from external platforms (Twitter, etc.) or just in-app shares?
2. Do we want real-time leaderboards or is periodic refresh acceptable?
3. Should leaderboard be its own page or integrated into existing pages?
4. Do we need to track share conversions (shares that lead to new users)?
5. Should we notify creators when their content is trending?

## Dependencies

### Technical
- Existing database (Vercel Postgres)
- Existing authentication system
- Existing share pages

### Design
- Leaderboard UI design
- Stats/analytics dashboard design
- Badge/trending indicator designs

## Notes

- Start with simple implementation, optimize later based on actual usage
- Consider privacy implications of tracking
- Make sure tracking doesn't slow down core sharing functionality
- Can add more detailed analytics over time as needs become clear
