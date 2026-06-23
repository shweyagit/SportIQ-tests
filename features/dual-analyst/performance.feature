## SC-040 to SC-043
## Performance tests use k6 — not Cucumber
## These scenarios document the intent only
## Automation: see k6 scripts in /k6/
#@performance
#Feature: Dual Analyst — Performance
#
#  Background:
#    Given the SportIQ API is running
#    And the analyst temperature is configured
#
#  # SC-040 | AC: SCRUM-13 SC-040
#  # Tool: k6 | Config: 1 VU, 3 iterations (one per sport)
#  @performance @p2
#  Scenario Outline: Baseline response time is within SLA for all sports
#    When I send a valid <sport> question
#    And I send the request
#    And I attach the request and response
#    Then the response status should be 200
#    And the response time should be under 10000 milliseconds
#    And the p50 response time should be under 6000 milliseconds
#
#    Examples:
#      | sport    |
#      | football |
#      | cricket  |
#      | tennis   |
#
#  # SC-041 | AC: SCRUM-13 SC-041
#  # Tool: k6 | Config: 10 VUs, 30s duration
#  @performance @p2
#  Scenario: Response time stays within SLA under concurrent load
#    When 10 virtual users send valid questions concurrently for 30 seconds
#    Then the p95 response time should be under 10000 milliseconds
#    And the response status should be 200 for all requests
#
#  # SC-042 | AC: SCRUM-13 SC-042
#  # Tool: k6 | Config: 10 VUs, 30s duration
#  @performance @p2
#  Scenario: Error rate stays below threshold under concurrent load
#    When 10 virtual users send valid questions concurrently for 30 seconds
#    Then the HTTP error rate should be below 5 percent
#
#  # SC-043 | AC: SCRUM-13 SC-043
#  # Tool: k6 | Config: 10 VUs, 30s duration
#  @performance @p2
#  Scenario: AI responses remain valid under concurrent load
#    When 10 virtual users send valid questions concurrently for 30 seconds
#    Then all successful responses should contain non-empty analyst content
#    And no successful response should have empty analystA or analystB
