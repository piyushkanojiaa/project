/**
 * Conjunctions Screen
 * 
 * Displays list of all conjunction events with filtering and sorting
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConjunctions } from '../../hooks/useConjunctions';
import ConjunctionList from '../../components/conjunction/ConjunctionList';

export default function ConjunctionsScreen() {
    const { conjunctions, loading, refetch } = useConjunctions({ limit: 100 });

    const handleSelectConjunction = (conjunction: any) => {
        // TODO: Navigate to conjunction details
        console.log('Selected conjunction:', conjunction.id);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ConjunctionList
                conjunctions={conjunctions}
                onSelect={handleSelectConjunction}
                loading={loading}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000510',
    },
});
