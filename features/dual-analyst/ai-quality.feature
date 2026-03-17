# SC-016 to SC-023
@ai-quality
Feature: Dual Analyst — AI Response Quality

  Background:
    Given the SportIQ API is running
    And the analyst temperature is configured

  # SC-016 | AC: SCRUM-13 SC-016
  @ai-quality @p1
  Scenario Outline: Both analysts return non-empty content for all sports
    When I send a valid <sport> question
    And I send the request
    And I attach the request and response
    Then the response status should be 200
    And both analysts should respond with content

    Examples:
      | sport    |
      | football |
      | cricket  |
      | tennis   |

  # SC-017 | AC: SCRUM-13 SC-017
  @ai-quality @p1 @football
  Scenario: Analysts return meaningfully different perspectives
    When I send a valid football question
    And I send the request
    And I attach the request and response
    Then both analysts should respond with content
    And the analysts should have different perspectives
    And the response should be scored by the quality evaluator

  # SC-018 | AC: SCRUM-13 SC-018
  @ai-quality @p2 @football
  Scenario: Football response contains football-specific vocabulary
    When I send a valid football question
    And I send the request
    And I attach the request and response
    Then both analysts should use football vocabulary
    And the response should be scored by the quality evaluator

  # SC-019 | AC: SCRUM-13 SC-019
  @ai-quality @p2 @cricket
  Scenario: Cricket response contains cricket-specific vocabulary
    When I send a valid cricket question
    And I send the request
    And I attach the request and response
    Then both analysts should use cricket vocabulary
    And the response should be scored by the quality evaluator

  # SC-020 | AC: SCRUM-13 SC-020
  @ai-quality @p2 @tennis
  Scenario: Tennis response contains tennis-specific vocabulary
    When I send a valid tennis question
    And I send the request
    And I attach the request and response
    Then both analysts should use tennis vocabulary
    And the response should be scored by the quality evaluator

  # SC-021 | AC: SCRUM-13 SC-021
  @ai-quality @p1 @football
  Scenario: Response references the specific topic from the question
    When I send a valid football question
    And I send the request
    And I attach the request and response
    Then both analysts should reference the question topic
    And neither analyst should give a generic non-specific response
    And the response should be scored by the quality evaluator

  # SC-022 | AC: SCRUM-13 SC-022
  @ai-quality @p2 @football
  Scenario: AnalystA reflects tactical perspective and analystB reflects data perspective
    When I send a valid football question
    And I send the request
    And I attach the request and response
    Then analystA should reflect a tactical perspective
    And analystB should reflect a data and statistics perspective
    And the response should be scored by the quality evaluator

  # SC-023 | AC: SCRUM-13 SC-023
  # BLOCKED: ANALYST_TEMPERATURE unconfirmed — do not run until resolved
  @ai-quality @p2 @football @blocked
  Scenario: Core factual claims are consistent across multiple runs
    When I send a valid football factual question
    And I send the request
    And I attach the request and response
    Then the factual claims should be consistent across 3 runs
    And the response should be scored by the quality evaluator
