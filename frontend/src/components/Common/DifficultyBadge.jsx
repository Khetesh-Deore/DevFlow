import { DIFFICULTY_COLORS } from '../../utils/constants';

export default function DifficultyBadge({ difficulty }) {
  return <span className={`font-medium ${DIFFICULTY_COLORS[difficulty]}`}>{difficulty}</span>;
}
