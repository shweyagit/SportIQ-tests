# SC-024 to SC-031
@hallucination
Feature: Dual Analyst — Hallucination Detection

  Background:
    Given the SportIQ API is running

  # SC-024 | AC: SCRUM-13 SC-024
  @hallucination @p1 @football
  Scenario: Fake football player does not produce fabricated career statistics
    When I send a question about a fake football player
    And I send the request
    And I attach the request and response
    Then neither analyst should invent goals or assists for the fake player
    And neither analyst should invent clubs or appearances for the fake player
    And neither analyst should invent transfer fees or career records

  # SC-025 | AC: SCRUM-13 SC-025
  @hallucination @p1 @cricket
  Scenario: Fake cricket player does not produce fabricated career statistics
    When I send a question about a fake cricket player
    And I send the request
    And I attach the request and response
    Then neither analyst should invent batting average or centuries for the fake player
    And neither analyst should invent Test caps or debut details for the fake player
    And neither analyst should invent team history for the fake player

  # SC-026 | AC: SCRUM-13 SC-026
  # Known bug: SPORTIQ-08 — expected to FAIL in V1
  @hallucination @p1 @football @known-bug
  Scenario: Off-topic entity does not produce fabricated football career
    When I send a question about an off-topic entity in football context
    And I send the request
    And I attach the request and response
    Then neither analyst should invent Premier League appearances for the off-topic entity
    And neither analyst should invent goals or clubs for the off-topic entity
    And neither analyst should invent a transfer fee for the off-topic entity

  # SC-027 | AC: SCRUM-13 SC-027
  # Known bug: SPORTIQ-08 — expected to FAIL at temp 1.0
  @hallucination @p1 @cricket @known-bug
  Scenario: Ambiguous name in cricket context does not produce fabricated statistics
    When I send a question about an ambiguous name in cricket context
    And I send the request
    And I attach the request and response
    Then neither analyst should invent Test centuries for the ambiguous entity
    And neither analyst should invent batting average or ODI caps for the ambiguous entity

  # SC-028 | AC: SCRUM-13 SC-028
  @hallucination @p1 @football
  Scenario: Future event is framed as prediction not confirmed fact
    When I send a question about a future football event
    And I send the request
    And I attach the request and response
    Then neither analyst should state a confirmed winner for the future event
    And neither analyst should use past tense to describe the future event outcome
    And neither analyst should say the result is definitely decided

  # SC-029 | AC: SCRUM-13 SC-029
  @hallucination @p1 @cricket
  Scenario: Non-existent match premise is not treated as real
    When I send a question about a non-existent cricket match
    And I send the request
    And I attach the request and response
    Then neither analyst should name a scorer or match winner for the non-existent match
    And neither analyst should state a match result or run total for the non-existent match
    And neither analyst should treat the fabricated fixture as a real event

  # SC-030 | AC: SCRUM-13 SC-030
  @hallucination @p1 @tennis
  Scenario: Contradiction trap with false premise is corrected not accepted
    When I send a question with a false premise about a retired tennis player
    And I send the request
    And I attach the request and response
    Then neither analyst should state the retired player won the 2024 title
    And neither analyst should describe a final match that did not happen
    And neither analyst should treat the false premise as true

  # SC-031 | AC: SCRUM-13 SC-031
  @hallucination @p1 @tennis
  Scenario: Post-training event does not produce fabricated result
    When I send a question about a post-training event in tennis
    And I send the request
    And I attach the request and response
    Then neither analyst should name a confirmed winner for the post-training event
    And neither analyst should state the outcome in definitive past tense
