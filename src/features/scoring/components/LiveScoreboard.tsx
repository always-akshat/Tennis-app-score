import { Card } from '@/components/ui';
import { getScorer } from '../engine';
import type { MatchState } from '@/types/scoring.types';

interface LiveScoreboardProps {
  matchState: MatchState;
  team1Name: string;
  team2Name: string;
  isLive?: boolean;
}

export function LiveScoreboard({
  matchState,
  team1Name,
  team2Name,
  isLive = false,
}: LiveScoreboardProps) {
  const scorer = getScorer(matchState.config.sport);
  const currentSet = matchState.sets[matchState.currentSetIndex];

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium uppercase tracking-wide">
          {matchState.config.sport}
        </span>
        {isLive && (
          <span className="flex items-center gap-1.5 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            LIVE
          </span>
        )}
      </div>

      {/* Score grid */}
      <div className="divide-y divide-gray-200">
        {/* Team 1 */}
        <TeamRow
          teamName={team1Name}
          teamNumber={1}
          matchState={matchState}
          isServing={matchState.servingTeam === 1}
          isWinner={matchState.matchWinner === 1}
        />

        {/* Team 2 */}
        <TeamRow
          teamName={team2Name}
          teamNumber={2}
          matchState={matchState}
          isServing={matchState.servingTeam === 2}
          isWinner={matchState.matchWinner === 2}
        />
      </div>

      {/* Current game score */}
      {!matchState.isComplete && (
        <div className="bg-gray-50 px-4 py-3 text-center">
          <span className="text-sm text-gray-500">Game: </span>
          <span className="text-lg font-bold text-gray-900">
            {scorer.formatGameScore(matchState)}
          </span>
          {currentSet.isTiebreak && (
            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
              Tiebreak
            </span>
          )}
        </div>
      )}

      {/* Match complete */}
      {matchState.isComplete && (
        <div className="bg-primary-50 px-4 py-3 text-center">
          <span className="text-primary-800 font-semibold">
            {matchState.matchWinner === 1 ? team1Name : team2Name} wins!
          </span>
        </div>
      )}
    </Card>
  );
}

interface TeamRowProps {
  teamName: string;
  teamNumber: 1 | 2;
  matchState: MatchState;
  isServing: boolean;
  isWinner: boolean;
}

function TeamRow({ teamName, teamNumber, matchState, isServing, isWinner }: TeamRowProps) {
  const setsWon = matchState.sets.filter((s) => s.winner === teamNumber).length;

  return (
    <div
      className={`flex items-center px-4 py-3 ${
        isWinner ? 'bg-primary-50' : ''
      }`}
    >
      {/* Serving indicator */}
      <div className="w-6">
        {isServing && !matchState.isComplete && (
          <span className="inline-flex h-2 w-2 rounded-full bg-yellow-400" title="Serving" />
        )}
      </div>

      {/* Team name */}
      <div className="flex-1 min-w-0">
        <span
          className={`font-medium truncate ${
            isWinner ? 'text-primary-700' : 'text-gray-900'
          }`}
        >
          {teamName}
        </span>
      </div>

      {/* Set scores */}
      <div className="flex items-center gap-2">
        {matchState.sets.map((set, index) => {
          const games = teamNumber === 1 ? set.team1Games : set.team2Games;
          const isCurrentSet = index === matchState.currentSetIndex;
          const wonSet = set.winner === teamNumber;

          return (
            <div
              key={index}
              className={`w-8 h-8 flex items-center justify-center rounded text-lg font-bold ${
                isCurrentSet && !matchState.isComplete
                  ? 'bg-primary-100 text-primary-700'
                  : wonSet
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {games}
            </div>
          );
        })}

        {/* Total sets won */}
        <div className="w-8 h-8 flex items-center justify-center bg-gray-800 text-white rounded font-bold ml-2">
          {setsWon}
        </div>
      </div>
    </div>
  );
}
