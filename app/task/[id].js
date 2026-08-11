import { useLocalSearchParams } from 'expo-router';
import TaskDetailScreen from '../../TaskDetailScreen';
import { parseParam } from '../../navigation';

export default function TaskRoute() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const task = parseParam(params.task);

  return (
    <TaskDetailScreen
      route={{ params: { id, task } }}
      navigation={null}
    />
  );
}