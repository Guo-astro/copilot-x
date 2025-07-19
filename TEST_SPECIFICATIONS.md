# Test Specification Example

This document demonstrates the Test-Driven Development (TDD) table detection feature.

## User Authentication Tests

| Test ID | Category | Description | Actor(s) | Setup | Expected | Validation | Requirement | Impl Priority | Impl Status |
|---------|----------|-------------|----------|--------|----------|------------|-------------|---------------|-------------|
| AUTH-001 | Security | User login with valid credentials | User | Valid user account exists | User successfully logs in and redirected to dashboard | User session created, dashboard displayed | REQ-AUTH-001 | High | TODO |
| AUTH-002 | Security | User login with invalid password | User | User account exists with wrong password | Login fails with error message | Error displayed: "Invalid credentials" | REQ-AUTH-002 | High | TODO |
| AUTH-003 | Security | User login with non-existent email | User | Non-existent email provided | Login fails with error message | Error displayed: "Account not found" | REQ-AUTH-003 | Medium | TODO |
| AUTH-004 | Security | User logout functionality | Authenticated User | User is logged in | User successfully logs out | Session terminated, redirected to login | REQ-AUTH-004 | Medium | In Progress |
| AUTH-005 | Security | Session timeout handling | Authenticated User | User inactive for 30 minutes | Session expires automatically | User redirected to login page | REQ-AUTH-005 | High | Done |

## Payment Processing Tests

| Test ID | Category | Description | Actor(s) | Setup | Expected | Validation | Requirement | Impl Priority | Impl Status |
|---------|----------|-------------|----------|--------|----------|------------|-------------|---------------|-------------|
| PAY-001 | Financial | Process credit card payment | Customer | Valid credit card, items in cart | Payment processed successfully | Transaction recorded, receipt generated | REQ-PAY-001 | Critical | TODO |
| PAY-002 | Financial | Handle declined credit card | Customer | Invalid/declined credit card | Payment fails gracefully | Error message displayed, cart preserved | REQ-PAY-002 | High | TODO |
| PAY-003 | Financial | Process refund request | Admin, Customer | Completed purchase exists | Refund processed to original payment method | Refund recorded, customer notified | REQ-PAY-003 | Medium | TODO |

## Notes

- Click the "🚀 Start TDD" button next to any test row to begin Test-Driven Development
- Click the "📝 Generate Test" button to create unit tests for that specification
- The system will automatically detect this table format and add interactive buttons
