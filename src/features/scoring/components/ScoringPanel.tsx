import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { getScorer } from '../engine';
import type { MatchState, Team } from '@/types/scoring.types';

interface ScoringPanelProps {
  matchState: MatchState;
  team1Name: string;
  team2Name: string;
  onScorePoint: (team: Team) => void;
  onUndo: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  canUndo?: boolean;
}

export function ScoringPanel({
  matchState,
  team1Name,
  team2Name,
  onScorePoint,
  onUndo,
  disabled = false,
  isLoading = false,
  canUndo = true,
}: ScoringPanelProps) {
  const [confirmUndo, setConfirmUndo] = useState(false);
  const scorer = getScorer(matchState.config.sport);

  const handleUndo = () => {
    if (confirmUndo) {
      onUndo();
      setConfirmUndo(false);
    } else {
      setConfirmUndo(true);
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => setConfirmUndo(false), 3000);
    }
  };

  if (matchState.isComplete) {
    return (
      <Card className="p-6 text-center">
        <div className="text-4xl mb-4">
          {matchState.matchWinner === 1 ? '1' : '2'}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Match Complete</h3>
        <p className="text-gray-600">
          {matchState.matchWinner === 1 ? team1Name : team2Name} wins
        </p>
        <p className="text-lg font-medium text-gray-900 mt-2">
          {scorer.formatScore(matchState)}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
        Score Point
      </h3>

      {/* Current score display */}
      <div className="text-center mb-6">
        <div className="text-sm text-gray-500 mb-1">Current Game</div>
        <div className="text-3xl font-bold text-gray-900">
          {scorer.formatGameScore(matchState)}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {matchState.sets[matchState.currentSetIndex].isTiebreak
            ? 'Tiebreak'
            : `Set ${matchState.currentSetIndex + 1}`}
        </div>
      </div>

      {/* Serving indicator */}
      <div className="text-center mb-6 text-sm text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          {matchState.servingTeam === 1 ? team1Name : team2Name} serving
        </span>
      </div>

      {/* Score buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <ScoreButton
          teamName={team1Name}
          teamNumber={1}
          isServing={matchState.servingTeam === 1}
          onClick={() => onScorePoint(1)}
          disabled={disabled || isLoading}
        />
        <ScoreButton
          teamName={team2Name}
          teamNumber={2}
          isServing={matchState.servingTeam === 2}
          onClick={() => onScorePoint(2)}
          disabled={disabled || isLoading}
        />
      </div>

      {/* Undo button */}
      {canUndo && (
        <div className="flex justify-center">
          <Button
            variant={confirmUndo ? 'danger' : 'ghost'}
            size="sm"
            onClick={handleUndo}
            disabled={disabled || isLoading}
          >
            {confirmUndo ? 'Confirm Undo' : 'Undo Last Point'}
          </Button>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      )}
    </Card>
  );
}

interface ScoreButtonProps {
  teamName: string;
  teamNumber: 1 | 2;
  isServing: boolean;
  onClick: () => void;
  disabled: boolean;
}

function ScoreButton({ teamName, teamNumber, isServing, onClick, disabled }: ScoreButtonProps) {
  const colors =
    teamNumber === 1
      ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
      : 'bg-red-600 hover:bg-red-700 active:bg-red-800';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex flex-col items-center justify-center
        h-32 rounded-xl text-white font-medium
        transition-all transform active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${colors}
      `}
    >
      {isServing && (
        <span className="absolute top-2 right-2 h-3 w-3 rounded-full bg-yellow-400" />
      )}
      <span className="text-lg truncate max-w-full px-2">{teamName}</span>
      <span className="text-sm opacity-75 mt-1">Tap to score</span>
    </button>
  );
}
