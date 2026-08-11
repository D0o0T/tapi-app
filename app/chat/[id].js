import { useLocalSearchParams } from 'expo-router';
import ChatDetailScreen from '../../ChatDetailScreen';
import { parseParam } from '../../navigation';

export default function ChatRoute() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const searchQuery = Array.isArray(params.searchQuery)
    ? params.searchQuery[0]
    : params.searchQuery || '';
  const chat = parseParam(params.chat);

  return (
    <ChatDetailScreen
      route={{ params: { id, chat, searchQuery } }}
      navigation={null}
    />
  );
}