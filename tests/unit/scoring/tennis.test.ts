import { describe, it, expect } from 'vitest';
import { createTennisScorer } from '@/features/scoring/engine/tennis';
import { TENNIS_STANDARD, TENNIS_FAST4 } from '@/types/scoring.types';
import type { MatchState, TennisGameState } from '@/types/scoring.types';

describe('Tennis Scoring Engine', () => {
  const scorer = createTennisScorer();

  const createInitialState = (config = TENNIS_STANDARD): MatchState => {
    return scorer.createInitialState('test-fixture', config, 1);
  };

  describe('Point Scoring', () => {
    it('should increment from 0 to 15', () => {
      const state = createInitialState();
      const newState = scorer.scorePoint(state, 1);
      const game = newState.currentGame as TennisGameState;

      expect(game.team1Points).toBe('15');
      expect(game.team2Points).toBe('0');
    });

    it('should follow sequence 0 -> 15 -> 30 -> 40', () => {
      let state = createInitialState();

      state = scorer.scorePoint(state, 1); // 15-0
      expect((state.currentGame as TennisGameState).team1Points).toBe('15');

      state = scorer.scorePoint(state, 1); // 30-0
      expect((state.currentGame as TennisGameState).team1Points).toBe('30');

      state = scorer.scorePoint(state, 1); // 40-0
      expect((state.currentGame as TennisGameState).team1Points).toBe('40');
    });

    it('should award game after winning point at 40-0', () => {
      let state = createInitialState();

      // Team 1 scores 4 points (0, 15, 30, 40, game)
      state = scorer.scorePoint(state, 1);
      state = scorer.scorePoint(state, 1);
      state = scorer.scorePoint(state, 1);
      state = scorer.scorePoint(state, 1);

      expect(state.sets[0].team1Games).toBe(1);
      expect((state.currentGame as TennisGameState).team1Points).toBe('0');
      expect((state.currentGame as TennisGameState).team2Points).toBe('0');
    });

    it('should track both players points correctly', () => {
      let state = createInitialState();

      state = scorer.scorePoint(state, 1); // 15-0
      state = scorer.scorePoint(state, 2); // 15-15
      state = scorer.scorePoint(state, 1); // 30-15
      state = scorer.scorePoint(state, 2); // 30-30

      const game = state.currentGame as TennisGameState;
      expect(game.team1Points).toBe('30');
      expect(game.team2Points).toBe('30');
    });
  });

  describe('Deuce and Advantage', () => {
    it('should reach 40-40 (deuce)', () => {
      let state = createInitialState();

      // Both to 40
      state = scorer.scorePoint(state, 1); // 15-0
      state = scorer.scorePoint(state, 1); // 30-0
      state = scorer.scorePoint(state, 1); // 40-0
      state = scorer.scorePoint(state, 2); // 40-15
      state = scorer.scorePoint(state, 2); // 40-30
      state = scorer.scorePoint(state, 2); // 40-40

      const game = state.currentGame as TennisGameState;
      expect(game.team1Points).toBe('40');
      expect(game.team2Points).toBe('40');
    });

    it('should award advantage from deuce', () => {
      let state = createInitialState();

      // Get to 40-40
      for (let i = 0; i < 3; i++) state = scorer.scorePoint(state, 1);
      for (let i = 0; i < 3; i++) state = scorer.scorePoint(state, 2);

      // Team 1 wins point from deuce
      state = scorer.scorePoint(state, 1);

      const game = state.currentGame as TennisGameState;
      expect(game.team1Points).toBe('AD');
      expect(game.team2Points).toBe('40');
    });

    it('should return to deuce if advantage is lost', () => {
      let state = createInitialState();

      // Get to 40-40
      for (let i = 0; i < 3; i++) state = scorer.scorePoint(state, 1);
      for (let i = 0; i < 3; i++) state = scorer.scorePoint(state, 2);

      // Team 1 gets advantage
      state = scorer.scorePoint(state, 1);
      expect((state.currentGame as TennisGameState).team1Points).toBe('AD');

      // Team 2 wins point, back to deuce
      state = scorer.scorePoint(state, 2);

      const game = state.currentGame as TennisGameState;
      expect(game.team1Points).toBe('40');
      expect(game.team2Points).toBe('40');
    });

    it('should win game from advantage', () => {
      let state = createInitialState();

      // Get to 40-40
      for (let i = 0; i < 3; i++) state = scorer.scorePoint(state, 1);
      for (let i = 0; i < 3; i++) state = scorer.scorePoint(state, 2);

      // Team 1 gets advantage and converts
      state = scorer.scorePoint(state, 1); // AD-40
      state = scorer.scorePoint(state, 1); // Game

      expect(state.sets[0].team1Games).toBe(1);
    });

    it('should use sudden death deuce in FAST4 format', () => {
      let state = createInitialState(TENNIS_FAST4);

      // Get to 40-40 (deuce)
      for (let i = 0; i < 3; i++) state = scorer.scorePoint(state, 1);
      for (let i = 0; i < 3; i++) state = scorer.scorePoint(state, 2);

      // Next point wins (no advantage)
      state = scorer.scorePoint(state, 1);

      expect(state.sets[0].team1Games).toBe(1);
    });
  });

  describe('Game Completion', () => {
    it('should change server after each game', () => {
      let state = createInitialState();
      expect(state.servingTeam).toBe(1);

      // Win a game
      for (let i = 0; i < 4; i++) state = scorer.scorePoint(state, 1);

      expect(state.servingTeam).toBe(2);
    });

    it('should track games correctly in a set', () => {
      let state = createInitialState();

      // Team 1 wins 3 games
      for (let game = 0; game < 3; game++) {
        for (let point = 0; point < 4; point++) {
          state = scorer.scorePoint(state, 1);
        }
      }

      // Team 2 wins 2 games
      for (let game = 0; game < 2; game++) {
        for (let point = 0; point < 4; point++) {
          state = scorer.scorePoint(state, 2);
        }
      }

      expect(state.sets[0].team1Games).toBe(3);
      expect(state.sets[0].team2Games).toBe(2);
    });
  });

  describe('Set Completion', () => {
    it('should win set at 6-4', () => {
      let state = createInitialState();

      // Team 1 wins 6 games, Team 2 wins 4
      for (let i = 0; i < 6; i++) {
        for (let p = 0; p < 4; p++) state = scorer.scorePoint(state, 1);
        if (i < 4) {
          for (let p = 0; p < 4; p++) state = scorer.scorePoint(state, 2);
        }
      }

      expect(state.sets[0].winner).toBe(1);
      expect(state.sets[0].team1Games).toBe(6);
      expect(state.sets[0].team2Games).toBe(4);
    });

    it('should require 2 game lead at 5-5', () => {
      let state = createInitialState();

      // Get to 5-5
      for (let i = 0; i < 5; i++) {
        for (let p = 0; p < 4; p++) state = scorer.scorePoint(state, 1);
        for (let p = 0; p < 4; p++) state = scorer.scorePoint(state, 2);
      }

      expect(state.sets[0].team1Games).toBe(5);
      expect(state.sets[0].team2Games).toBe(5);
      expect(state.sets[0].winner).toBeNull();

      // Team 1 wins to 6-5
      for (let p = 0; p < 4; p++) state = scorer.scorePoint(state, 1);

      expect(state.sets[0].team1Games).toBe(6);
      expect(state.sets[0].team2Games).toBe(5);
      expect(state.sets[0].winner).toBeNull(); // Still no winner

      // Team 1 wins to 7-5
      for (let p = 0; p < 4; p++) state = scorer.scorePoint(state, 1);

      expect(state.sets[0].winner).toBe(1);
    });
  });

  describe('Tiebreak', () => {
    const getTo66 = (): MatchState => {
      let state = createInitialState();

      // Get to 6-6
      for (let i = 0; i < 6; i++) {
        for (let p = 0; p < 4; p++) state = scorer.scorePoint(state, 1);
        for (let p = 0; p < 4; p++) state = scorer.scorePoint(state, 2);
      }

      return state;
    };

    it('should start tiebreak at 6-6', () => {
      const state = getTo66();

      expect(state.sets[0].team1Games).toBe(6);
      expect(state.sets[0].team2Games).toBe(6);
      expect(state.sets[0].isTiebreak).toBe(true);
      expect(state.sets[0].tiebreakScore).toEqual({ team1: 0, team2: 0 });
    });

    it('should use numeric points in tiebreak', () => {
      let state = getTo66();

      state = scorer.scorePoint(state, 1);

      expect(state.sets[0].tiebreakScore).toEqual({ team1: 1, team2: 0 });
    });

    it('should win tiebreak at 7-5', () => {
      let state = getTo66();

      // Team 1 wins 7-5
      for (let i = 0; i < 7; i++) state = scorer.scorePoint(state, 1);
      for (let i = 0; i < 5; i++) state = scorer.scorePoint(state, 2);

      expect(state.sets[0].winner).toBe(1);
      expect(state.sets[0].team1Games).toBe(7);
      expect(state.sets[0].team2Games).toBe(6);
    });

    it('should continue tiebreak at 6-6 (win by 2)', () => {
      let state = getTo66();

      // Get to 6-6 in tiebreak
      for (let i = 0; i < 6; i++) {
        state = scorer.scorePoint(state, 1);
        state = scorer.scorePoint(state, 2);
      }

      expect(state.sets[0].tiebreakScore).toEqual({ team1: 6, team2: 6 });
      expect(state.sets[0].winner).toBeNull();

      // 7-6 still not won
      state = scorer.scorePoint(state, 1);
      expect(state.sets[0].winner).toBeNull();

      // 8-6 is a win
      state = scorer.scorePoint(state, 1);
      expect(state.sets[0].winner).toBe(1);
    });
  });

  describe('Match Completion', () => {
    it('should complete match when player wins required sets', () => {
      let state = createInitialState();

      // Win first set 6-0
      for (let game = 0; game < 6; game++) {
        for (let point = 0; point < 4; point++) {
          state = scorer.scorePoint(state, 1);
        }
      }

      expect(state.sets[0].winner).toBe(1);
      expect(state.currentSetIndex).toBe(1);

      // Win second set 6-0
      for (let game = 0; game < 6; game++) {
        for (let point = 0; point < 4; point++) {
          state = scorer.scorePoint(state, 1);
        }
      }

      expect(state.matchWinner).toBe(1);
      expect(state.isComplete).toBe(true);
    });

    it('should not allow scoring after match is complete', () => {
      let state = createInitialState();

      // Win match 6-0, 6-0
      for (let set = 0; set < 2; set++) {
        for (let game = 0; game < 6; game++) {
          for (let point = 0; point < 4; point++) {
            state = scorer.scorePoint(state, 1);
          }
        }
      }

      expect(state.isComplete).toBe(true);

      // Try to score another point
      const newState = scorer.scorePoint(state, 2);

      // State should be unchanged
      expect(newState).toEqual(state);
    });
  });

  describe('Score Formatting', () => {
    it('should format ongoing match correctly', () => {
      let state = createInitialState();

      // Win first set 6-4, second set in progress 3-2
      for (let game = 0; game < 6; game++) {
        for (let point = 0; point < 4; point++) state = scorer.scorePoint(state, 1);
        if (game < 4) {
          for (let point = 0; point < 4; point++) state = scorer.scorePoint(state, 2);
        }
      }

      // Second set 3-2
      for (let game = 0; game < 3; game++) {
        for (let point = 0; point < 4; point++) state = scorer.scorePoint(state, 1);
        if (game < 2) {
          for (let point = 0; point < 4; point++) state = scorer.scorePoint(state, 2);
        }
      }

      const formatted = scorer.formatScore(state);
      expect(formatted).toContain('6-4');
      expect(formatted).toContain('3-2');
    });

    it('should format game score correctly', () => {
      let state = createInitialState();

      state = scorer.scorePoint(state, 1); // 15-0
      state = scorer.scorePoint(state, 2); // 15-15
      state = scorer.scorePoint(state, 1); // 30-15

      const gameScore = scorer.formatGameScore(state);
      expect(gameScore).toBe('30-15');
    });
  });
});
