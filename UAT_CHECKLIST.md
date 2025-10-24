# User Acceptance Testing (UAT) Checklist

## Authentication & User Management

### Registration
- [ ] User can create account with email and password
- [ ] Email validation works correctly
- [ ] Password must meet minimum requirements
- [ ] Auto-confirm email works (no verification needed)
- [ ] User redirected to login after successful registration
- [ ] Error messages display for invalid inputs

### Login
- [ ] User can log in with valid credentials
- [ ] Error message shows for invalid credentials
- [ ] User redirected to home page after login
- [ ] Session persists across page refreshes
- [ ] "Remember me" functionality works

### Logout
- [ ] User can log out successfully
- [ ] Session cleared after logout
- [ ] User redirected appropriately
- [ ] Protected routes blocked after logout

## Public Pages

### Home Page
- [ ] Hero section displays correctly
- [ ] Today's games load and display
- [ ] Game cards show all relevant information
- [ ] Predictions visible and formatted correctly
- [ ] Responsive design works on mobile
- [ ] Images load properly
- [ ] Navigation works correctly

### Game Detail Page
- [ ] Game information displays correctly
- [ ] Predictions show with confidence scores
- [ ] AI-generated narratives display
- [ ] Injury reports shown if available
- [ ] Weather information displayed
- [ ] Odds comparison visible
- [ ] Save selection button works (when logged in)
- [ ] PDF export button works
- [ ] TTS audio generation works

### Historical Performance
- [ ] Performance metrics display correctly
- [ ] Charts render properly
- [ ] Filters work correctly
- [ ] Data updates reflect in charts
- [ ] Export functionality works
- [ ] Mobile responsive

### About Page
- [ ] All sections display correctly
- [ ] Methodology explanation clear
- [ ] Disclaimers visible
- [ ] Links work properly

## Protected Pages (Require Login)

### Account Settings
- [ ] User information displays correctly
- [ ] Timezone selection works
- [ ] Theme selection works
- [ ] Notification preferences save
- [ ] Export data button works
- [ ] Delete account works (with confirmation)
- [ ] Changes persist after refresh

### My Selections
- [ ] Saved selections display correctly
- [ ] Selection details visible
- [ ] Notes editable
- [ ] Delete selection works
- [ ] CSV export works
- [ ] Results update correctly
- [ ] Win/loss statistics accurate

## Admin Features (Admin Users Only)

### Admin Panel Access
- [ ] Only admin users can access
- [ ] Non-admin users redirected
- [ ] All admin sections load

### Data Source Management
- [ ] View all data sources
- [ ] Add new data source works
- [ ] Toggle source active/inactive
- [ ] Source health status accurate
- [ ] Failure counts display correctly

### Moderation
- [ ] Pending submissions display
- [ ] Approve submission works
- [ ] Reject submission works (with reason)
- [ ] Approved sources added to registry
- [ ] Badge counts update correctly

### Dashboard (Observability)
- [ ] Model metrics display correctly
- [ ] Performance charts render
- [ ] Source health indicators accurate
- [ ] Alert counts display
- [ ] Recent evaluations show

## Edge Functions

### Data Ingestion
- [ ] Odds ingestion works
- [ ] Injury data ingestion works
- [ ] Weather data ingestion works
- [ ] Data stored in database correctly
- [ ] Error handling works

### Predictions
- [ ] Feature building works
- [ ] Predictions generated correctly
- [ ] Confidence scores calculated
- [ ] Model calibration runs
- [ ] Evaluations stored properly

### Narratives
- [ ] AI narratives generate successfully
- [ ] Caching works correctly
- [ ] Economy mode triggers appropriately
- [ ] Narratives display well

### Orchestrator
- [ ] All steps execute in order
- [ ] Errors handled gracefully
- [ ] Status returned correctly
- [ ] Can be triggered manually

### Utilities
- [ ] PDF generation works
- [ ] TTS generation works
- [ ] Health check returns status
- [ ] Alert monitor runs correctly
- [ ] User data export works

## Security

### Authentication
- [ ] JWT tokens work correctly
- [ ] Session management secure
- [ ] Password hashing implemented
- [ ] Rate limiting prevents abuse

### Authorization
- [ ] RLS policies enforce correctly
- [ ] Admin-only features blocked for non-admins
- [ ] User can only access own data
- [ ] has_role function works correctly

### Input Validation
- [ ] SQL injection prevented
- [ ] XSS attacks prevented
- [ ] CSRF protection implemented
- [ ] File upload restrictions work

### Data Privacy
- [ ] User data encrypted
- [ ] Passwords not stored in plain text
- [ ] API keys stored as secrets
- [ ] Audit logs capturing actions

## Performance

### Load Times
- [ ] Home page loads < 3 seconds
- [ ] Game detail loads < 2 seconds
- [ ] Charts render < 1 second
- [ ] Edge functions respond < 5 seconds

### Responsiveness
- [ ] Mobile layout works correctly
- [ ] Tablet layout works correctly
- [ ] Desktop layout works correctly
- [ ] Touch interactions work on mobile

### Optimization
- [ ] Images lazy-loaded
- [ ] Database queries optimized
- [ ] Caching implemented
- [ ] No memory leaks

## Legal & Compliance

### Disclaimers
- [ ] Not gambling advice visible everywhere
- [ ] 18+ requirement stated
- [ ] Responsible gaming link present

### Privacy
- [ ] Privacy policy accessible
- [ ] Cookie consent shown
- [ ] Data export functionality works
- [ ] Account deletion works

### Terms
- [ ] Terms of service accessible
- [ ] Clear and comprehensive
- [ ] User acceptance tracked

## Error Handling

### User-Facing Errors
- [ ] Friendly error messages
- [ ] Toast notifications work
- [ ] Error boundary catches React errors
- [ ] 404 page displays correctly

### System Errors
- [ ] Edge function errors logged
- [ ] Database errors handled
- [ ] Network errors handled gracefully
- [ ] Retry logic works

## Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Android Firefox

## Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Focus indicators visible
- [ ] Alt text on images
- [ ] ARIA labels present

## Final Checks

- [ ] All console errors resolved
- [ ] No broken links
- [ ] All images load
- [ ] Forms validate correctly
- [ ] Loading states display
- [ ] Empty states handled
- [ ] Success messages shown
- [ ] Animations smooth
- [ ] No spelling errors
- [ ] Branding consistent

## Sign-Off

**Tested By:** ___________________  
**Date:** ___________________  
**Environment:** Production / Staging  
**Issues Found:** ___________________  
**Ready for Launch:** Yes / No  

---

**Notes:**
