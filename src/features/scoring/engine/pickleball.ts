import type {
  MatchState,
  SetState,
  PickleballGameState,
  ScoringConfig,
  ScoringEngine,
  Team,
} from '@/types/scoring.types';

// ============================================
// PICKLEBALL SCORING ENGINE
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

function createInitialGame(): PickleballGameState {
  return {
    team1Points: 0,
    team2Points: 0,
    serverNumber: 1,
  };
}

function scorePoint(state: MatchState, scoringTeam: Team): MatchState {
  if (state.isComplete) {
    return state;
  }

  const game = state.currentGame as PickleballGameState;
  const config = state.config;
  const pointsToWin = config.pointsPerGame || 11;

  // Rally scoring: any team can score on any rally
  // Side-out scoring: only serving team can score
  if (!config.rallyScoring && scoringTeam !== state.servingTeam) {
    // Side-out: serving team loses rally, switch server
    let newServerNumber = game.serverNumber;
    let newServingTeam = state.servingTeam;

    // In doubles side-out, second server serves before side-out
    if (game.serverNumber === 1) {
      newServerNumber = 2;
    } else {
      newServerNumber = 1;
      newServingTeam = state.servingTeam === 1 ? 2 : 1;
    }

    return {
      ...state,
      currentGame: { ...game, serverNumber: newServerNumber },
      servingTeam: newServingTeam,
    };
  }

  // Score the point
  const scoringKey = scoringTeam === 1 ? 'team1Points' : 'team2Points';
  const otherKey = scoringTeam === 1 ? 'team2Points' : 'team1Points';

  const newPoints = game[scoringKey] + 1;
  const otherPoints = game[otherKey];

  // Check for game win
  const hasEnoughPoints = newPoints >= pointsToWin;
  const hasRequiredLead = config.winByTwo
    ? newPoints - otherPoints >= 2
    : newPoints > otherPoints;

  if (hasEnoughPoints && hasRequiredLead) {
    // Game (set) won
    const currentSet = state.sets[state.currentSetIndex];
    const updatedSet: SetState = {
      ...currentSet,
      team1Games: currentSet.team1Games + (scoringTeam === 1 ? 1 : 0),
      team2Games: currentSet.team2Games + (scoringTeam === 2 ? 1 : 0),
      winner: scoringTeam,
    };

    // Count games (sets) won
    const team1Games = state.sets.filter(s => s.winner === 1).length + (scoringTeam === 1 ? 1 : 0);
    const team2Games = state.sets.filter(s => s.winner === 2).length + (scoringTeam === 2 ? 1 : 0);

    // Check for match win
    if (team1Games === state.config.setsToWin || team2Games === state.config.setsToWin) {
      return {
        ...state,
        sets: state.sets.map((s, i) => (i === state.currentSetIndex ? updatedSet : s)),
        currentGame: { ...game, [scoringKey]: newPoints },
        matchWinner: scoringTeam,
        isComplete: true,
      };
    }

    // Start new game
    return {
      ...state,
      sets: [
        ...state.sets.map((s, i) => (i === state.currentSetIndex ? updatedSet : s)),
        createInitialSet(state.currentSetIndex + 2),
      ],
      currentSetIndex: state.currentSetIndex + 1,
      currentGame: createInitialGame(),
      servingTeam: scoringTeam === 1 ? 2 : 1, // Loser serves first in new game
    };
  }

  // Continue game
  const newGame: PickleballGameState = {
    ...game,
    [scoringKey]: newPoints,
  };

  // In rally scoring, server changes after each point
  let newServingTeam = state.servingTeam;
  if (config.rallyScoring) {
    newServingTeam = scoringTeam;
  }

  return {
    ...state,
    currentGame: newGame,
    servingTeam: newServingTeam,
  };
}

function formatScore(state: MatchState): string {
  const gamesWon = {
    team1: state.sets.filter(s => s.winner === 1).length,
    team2: state.sets.filter(s => s.winner === 2).length,
  };

  return `Games: ${gamesWon.team1}-${gamesWon.team2}`;
}

function formatGameScore(state: MatchState): string {
  const game = state.currentGame as PickleballGameState;

  if (state.config.rallyScoring) {
    return `${game.team1Points}-${game.team2Points}`;
  }

  // Side-out scoring: show server number
  const servingTeamPoints = state.servingTeam === 1 ? game.team1Points : game.team2Points;
  const receivingTeamPoints = state.servingTeam === 1 ? game.team2Points : game.team1Points;

  return `${servingTeamPoints}-${receivingTeamPoints}-${game.serverNumber}`;
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
  const previousEvent = events[events.length - 1];
  return previousEvent.scoreSnapshot;
}

function isMatchComplete(state: MatchState): boolean {
  return state.isComplete;
}

export function createPickleballScorer(): ScoringEngine {
  return {
    scorePoint,
    undoLastPoint,
    isMatchComplete,
    formatScore,
    formatGameScore,
    createInitialState,
  };
}

export const pickleballScorer = createPickleballScorer();
