import { useLocalSearchParams } from 'expo-router';
import BillDetailScreen from '../../BillDetailScreen';
import { parseParam } from '../../navigation';

export default function BillRoute() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const bill = parseParam(params.bill);

  return (
    <BillDetailScreen
      route={{ params: { id, bill } }}
      navigation={null}
    />
  );
}