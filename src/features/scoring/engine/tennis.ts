import type {
  MatchState,
  SetState,
  TennisGameState,
  ScoringConfig,
  ScoringEngine,
  Team,
  TennisPoint,
} from '@/types/scoring.types';
import { TENNIS_POINTS } from '@/types/scoring.types';

// ============================================
// TENNIS SCORING ENGINE
// Pure functional implementation
// ============================================

function createInitialSet(setNumber: number): SetState {
  return {
    setNumber,
    team1Games: 0,
    team2Games: 0,
    isTiebreak: false,
    tiebreakScore: null,
    winner: null,
  };
}

function createInitialGame(): TennisGameState {
  return {
    team1Points: '0',
    team2Points: '0',
  };
}

function getNextPoint(current: TennisPoint): TennisPoint {
  const index = TENNIS_POINTS.indexOf(current as (typeof TENNIS_POINTS)[number]);
  if (index === -1 || index >= TENNIS_POINTS.length - 1) {
    return current;
  }
  return TENNIS_POINTS[index + 1];
}

function scoreRegularPoint(
  game: TennisGameState,
  scoringTeam: Team,
  advantageScoring: boolean
): { newGame: TennisGameState; gameWon: Team | null } {
  const scoringKey = scoringTeam === 1 ? 'team1Points' : 'team2Points';
  const otherKey = scoringTeam === 1 ? 'team2Points' : 'team1Points';

  const scoringPoints = game[scoringKey];
  const otherPoints = game[otherKey];

  // Handle deuce/advantage scenarios
  if (scoringPoints === '40' && otherPoints === '40') {
    if (advantageScoring) {
      // Deuce -> Advantage
      return {
        newGame: { ...game, [scoringKey]: 'AD' as TennisPoint },
        gameWon: null,
      };
    } else {
      // No advantage (sudden death) - win the game
      return {
        newGame: createInitialGame(),
        gameWon: scoringTeam,
      };
    }
  }

  if (scoringPoints === 'AD') {
    // Advantage -> Win game
    return {
      newGame: createInitialGame(),
      gameWon: scoringTeam,
    };
  }

  if (otherPoints === 'AD') {
    // Other player had advantage, back to deuce
    return {
      newGame: { team1Points: '40', team2Points: '40' },
      gameWon: null,
    };
  }

  if (scoringPoints === '40') {
    // 40 -> Win game (opponent not at 40)
    return {
      newGame: createInitialGame(),
      gameWon: scoringTeam,
    };
  }

  // Normal point progression: 0 -> 15 -> 30 -> 40
  return {
    newGame: { ...game, [scoringKey]: getNextPoint(scoringPoints) },
    gameWon: null,
  };
}

function scoreTiebreakPoint(
  set: SetState,
  scoringTeam: Team,
  config: ScoringConfig
): { newSet: SetState; setWon: Team | null } {
  if (!set.tiebreakScore) {
    throw new Error('Tiebreak score not initialized');
  }

  const scoringKey = scoringTeam === 1 ? 'team1' : 'team2';
  const otherKey = scoringTeam === 1 ? 'team2' : 'team1';

  const newScore = {
    ...set.tiebreakScore,
    [scoringKey]: set.tiebreakScore[scoringKey] + 1,
  };

  const scoringPoints = newScore[scoringKey];
  const otherPoints = newScore[otherKey];

  // Determine tiebreak target (usually 7, but can be 10 for super-tiebreak)
  const isFinalSet = set.setNumber === config.setsToWin * 2 - 1;
  const tiebreakTarget = isFinalSet && config.finalSetTiebreak
    ? config.finalSetTiebreakPoints
    : 7;

  // Check for win (must win by 2)
  if (scoringPoints >= tiebreakTarget && scoringPoints - otherPoints >= 2) {
    return {
      newSet: {
        ...set,
        tiebreakScore: newScore,
        team1Games: set.team1Games + (scoringTeam === 1 ? 1 : 0),
        team2Games: set.team2Games + (scoringTeam === 2 ? 1 : 0),
        winner: scoringTeam,
      },
      setWon: scoringTeam,
    };
  }

  return {
    newSet: { ...set, tiebreakScore: newScore },
    setWon: null,
  };
}

function checkSetWon(
  set: SetState,
  config: ScoringConfig
): Team | null {
  const { team1Games, team2Games, isTiebreak } = set;
  const { gamesPerSet } = config;

  // Don't check during tiebreak (handled separately)
  if (isTiebreak) return null;

  // Standard set win: 6 games with 2 game lead
  if (team1Games >= gamesPerSet && team1Games - team2Games >= 2) return 1;
  if (team2Games >= gamesPerSet && team2Games - team1Games >= 2) return 2;

  // 7-5 win
  if (team1Games === gamesPerSet + 1 && team2Games === gamesPerSet - 1) return 1;
  if (team2Games === gamesPerSet + 1 && team1Games === gamesPerSet - 1) return 2;

  return null;
}

function shouldStartTiebreak(set: SetState, config: ScoringConfig): boolean {
  return (
    set.team1Games === config.tiebreakAt &&
    set.team2Games === config.tiebreakAt &&
    !set.isTiebreak
  );
}

function updateServerAfterGame(currentServer: Team): Team {
  return currentServer === 1 ? 2 : 1;
}

function updateServerInTiebreak(
  currentServer: Team,
  totalPoints: number
): Team {
  // First point: starting server
  // Then change every 2 points
  if (totalPoints === 0) return currentServer;
  if (totalPoints === 1) return currentServer === 1 ? 2 : 1;
  if ((totalPoints - 1) % 2 === 0) return currentServer === 1 ? 2 : 1;
  return currentServer;
}

function scorePoint(state: MatchState, scoringTeam: Team): MatchState {
  if (state.isComplete) {
    return state;
  }

  const currentSet = state.sets[state.currentSetIndex];
  const game = state.currentGame as TennisGameState;

  // Handle tiebreak scoring
  if (currentSet.isTiebreak) {
    const { newSet, setWon } = scoreTiebreakPoint(currentSet, scoringTeam, state.config);

    const totalTiebreakPoints = newSet.tiebreakScore
      ? newSet.tiebreakScore.team1 + newSet.tiebreakScore.team2
      : 0;

    if (setWon) {
      // Check if match is won
      const team1Sets = state.sets.filter(s => s.winner === 1).length + (setWon === 1 ? 1 : 0);
      const team2Sets = state.sets.filter(s => s.winner === 2).length + (setWon === 2 ? 1 : 0);

      if (team1Sets === state.config.setsToWin || team2Sets === state.config.setsToWin) {
        return {
          ...state,
          sets: state.sets.map((s, i) => (i === state.currentSetIndex ? newSet : s)),
          matchWinner: setWon,
          isComplete: true,
        };
      }

      // Start new set
      return {
        ...state,
        sets: [
          ...state.sets.map((s, i) => (i === state.currentSetIndex ? newSet : s)),
          createInitialSet(state.currentSetIndex + 2),
        ],
        currentSetIndex: state.currentSetIndex + 1,
        currentGame: createInitialGame(),
        servingTeam: updateServerAfterGame(state.servingTeam),
      };
    }

    return {
      ...state,
      sets: state.sets.map((s, i) => (i === state.currentSetIndex ? newSet : s)),
      servingTeam: updateServerInTiebreak(state.servingTeam, totalTiebreakPoints),
    };
  }

  // Regular game scoring
  const { newGame, gameWon } = scoreRegularPoint(
    game,
    scoringTeam,
    state.config.advantageScoring
  );

  if (!gameWon) {
    return {
      ...state,
      currentGame: newGame,
    };
  }

  // Game was won - update set
  const updatedSet: SetState = {
    ...currentSet,
    team1Games: currentSet.team1Games + (gameWon === 1 ? 1 : 0),
    team2Games: currentSet.team2Games + (gameWon === 2 ? 1 : 0),
  };

  // Check if tiebreak should start
  if (shouldStartTiebreak(updatedSet, state.config)) {
    return {
      ...state,
      sets: state.sets.map((s, i) =>
        i === state.currentSetIndex
          ? { ...updatedSet, isTiebreak: true, tiebreakScore: { team1: 0, team2: 0 } }
          : s
      ),
      currentGame: createInitialGame(),
      servingTeam: updateServerAfterGame(state.servingTeam),
    };
  }

  // Check if set was won
  const setWinner = checkSetWon(updatedSet, state.config);

  if (setWinner) {
    const finalSet: SetState = { ...updatedSet, winner: setWinner };

    // Count sets won
    const team1Sets = state.sets.filter(s => s.winner === 1).length + (setWinner === 1 ? 1 : 0);
    const team2Sets = state.sets.filter(s => s.winner === 2).length + (setWinner === 2 ? 1 : 0);

    // Check if match is won
    if (team1Sets === state.config.setsToWin || team2Sets === state.config.setsToWin) {
      return {
        ...state,
        sets: state.sets.map((s, i) => (i === state.currentSetIndex ? finalSet : s)),
        currentGame: newGame,
        matchWinner: setWinner,
        isComplete: true,
      };
    }

    // Start new set
    return {
      ...state,
      sets: [
        ...state.sets.map((s, i) => (i === state.currentSetIndex ? finalSet : s)),
        createInitialSet(state.currentSetIndex + 2),
      ],
      currentSetIndex: state.currentSetIndex + 1,
      currentGame: createInitialGame(),
      servingTeam: updateServerAfterGame(state.servingTeam),
    };
  }

  // Continue current set
  return {
    ...state,
    sets: state.sets.map((s, i) => (i === state.currentSetIndex ? updatedSet : s)),
    currentGame: newGame,
    servingTeam: updateServerAfterGame(state.servingTeam),
  };
}

function formatScore(state: MatchState): string {
  const setScores = state.sets
    .filter(s => s.team1Games > 0 || s.team2Games > 0 || s.winner !== null)
    .map(s => {
      let score = `${s.team1Games}-${s.team2Games}`;
      if (s.isTiebreak && s.tiebreakScore && s.winner) {
        const loserTiebreakPoints = s.winner === 1
          ? s.tiebreakScore.team2
          : s.tiebreakScore.team1;
        score += `(${loserTiebreakPoints})`;
      }
      return score;
    });

  return setScores.join(', ');
}

function formatGameScore(state: MatchState): string {
  const currentSet = state.sets[state.currentSetIndex];
  const game = state.currentGame as TennisGameState;

  if (currentSet.isTiebreak && currentSet.tiebreakScore) {
    return `${currentSet.tiebreakScore.team1}-${currentSet.tiebreakScore.team2}`;
  }

  return `${game.team1Points}-${game.team2Points}`;
}

function createInitialState(
  fixtureId: string,
  config: ScoringConfig,
  servingTeam: Team
): MatchState {
  return {
    fixtureId,
    config,
    sets: [createInitialSet(1)],
    currentSetIndex: 0,
    currentGame: createInitialGame(),
    servingTeam,
    matchWinner: null,
    isComplete: false,
  };
}

function undoLastPoint(state: MatchState, events: readonly { scoreSnapshot: MatchState }[]): MatchState {
  if (events.length === 0) {
    return state;
  }
  // Return the previous state snapshot
  const previousEvent = events[events.length - 1];
  return previousEvent.scoreSnapshot;
}

function isMatchComplete(state: MatchState): boolean {
  return state.isComplete;
}

export function createTennisScorer(): ScoringEngine {
  return {
    scorePoint,
    undoLastPoint,
    isMatchComplete,
    formatScore,
    formatGameScore,
    createInitialState,
  };
}

export const tennisScorer = createTennisScorer();
