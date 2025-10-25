# Bin Request Unit Tests

This directory contains comprehensive unit tests for the bin requesting functionality in the EcoTrack system.

## Test Coverage

The `binRequest.test.js` file includes 23 test cases covering:

### 1. **createBinRequest** (4 tests)
- ✅ Create a new bin request successfully
- ✅ Handle invalid user (404 error)
- ✅ Support all bin types (general, recyclable, organic, hazardous)
- ✅ Handle errors gracefully

### 2. **approveAndAssignRequest** (4 tests)
- ✅ Approve a pending bin request and create delivery
- ✅ Handle non-existent requests (404 error)
- ✅ Prevent approval of already processed requests (400 error)
- ✅ Handle payment verification

### 3. **getRequests** (3 tests)
- ✅ Get all bin requests for operator/admin roles
- ✅ Get only own bin requests for resident role
- ✅ Support pagination

### 4. **cancelBinRequest** (4 tests)
- ✅ Cancel a pending bin request
- ✅ Handle non-existent requests (404 error)
- ✅ Prevent unauthorized cancellation (403 error)
- ✅ Prevent cancellation of non-pending requests (400 error)

### 5. **confirmBinReceipt** (4 tests)
- ✅ Confirm receipt of already delivered bin
- ✅ Handle bins still in delivery (400 error)
- ✅ Handle non-existent requests (404 error)
- ✅ Prevent unauthorized confirmation (403 error)

### 6. **BinRequest Model** (4 tests)
- ✅ Auto-generate unique requestId
- ✅ Default status is 'pending'
- ✅ Accept all valid bin types
- ✅ Store coordinates correctly

## Running the Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (for development)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Environment

- **Test Framework**: Jest with ES modules support
- **Database**: MongoDB Memory Server (in-memory database for testing)
- **Test Isolation**: Each test runs in a clean database state
- **Mock Objects**: Request and response objects are mocked for controller testing

## Test Structure

```javascript
beforeAll()     // Setup test database
afterAll()      // Teardown test database
afterEach()     // Clear database between tests
```

## Key Features

1. **Isolated Tests**: Each test runs independently with a fresh database
2. **Mock Users**: Helper functions create test users with different roles
3. **Complete Coverage**: Tests cover success cases, error cases, and edge cases
4. **Real Database**: Uses MongoDB Memory Server for realistic testing
5. **Fast Execution**: All tests complete in ~4 seconds

## Understanding the Tests

### Example Test Structure
```javascript
it('should create a new bin request successfully', async () => {
  // Arrange: Set up test data
  const resident = await createTestUser('resident');
  req.user = { _id: resident._id };
  req.body = { /* request data */ };

  // Act: Call the function
  await createBinRequest(req, res);

  // Assert: Verify results
  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledWith(/* expected response */);
});
```

## Adding New Tests

To add new test cases:

1. Follow the existing test structure
2. Use the `mockReqRes()` helper for request/response objects
3. Use the `createTestUser()` helper to create test users
4. Clear database state with `clearDatabase()` in `afterEach()`
5. Add descriptive test names using `it('should ...')`

## Dependencies

- `jest`: Test framework
- `@jest/globals`: Jest globals for ES modules
- `mongodb-memory-server`: In-memory MongoDB for testing
- `mongoose`: MongoDB ODM

## Notes

- Tests use ES modules (`.js` files with `"type": "module"`)
- The experimental VM modules flag is required for Jest with ES modules
- All console.log statements from the application are visible during test runs
- Tests automatically clean up after themselves (no database pollution)
