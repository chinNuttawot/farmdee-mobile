import AsyncStorage from "@react-native-async-storage/async-storage";


export class StorageUtility {
    static async get(key: string): Promise<any> {
        try {
            return await AsyncStorage.getItem(key);
        } catch (error) {
            throw error;
        }
    }

    static async set(key: string, value: any): Promise<void> {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (error) {
            throw error;
        }
    }

    static async remove(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            throw error;
        }
    }
}
