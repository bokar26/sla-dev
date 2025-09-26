import { useLocalSearchParams } from 'expo-router';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import { Text } from 'react-native';

export default function VendorDetail() {
  const { id } = useLocalSearchParams<{ id:string }>();
  return (
    <Screen>
      <Text style={{ fontSize:24, fontWeight:'700' }}>Vendor {id}</Text>
      <Card>
        <Text>Details, performance metrics, contact info, SKUs matched, notes (coming soon).</Text>
      </Card>
    </Screen>
  );
}
