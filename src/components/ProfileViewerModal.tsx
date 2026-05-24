import { Modal, SafeAreaView, StyleSheet } from "react-native";
import ProfileViewer from "./ProfileViewer";

type UserType = "talento" | "empresa" | "universidad";

interface ProfileViewerModalProps {
  visible: boolean;
  userId: string;
  userType: UserType;
  onClose: () => void;
}

export default function ProfileViewerModal({
  visible,
  userId,
  userType,
  onClose,
}: ProfileViewerModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <ProfileViewer userId={userId} userType={userType} onGoBack={onClose} />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07050f",
  },
});
