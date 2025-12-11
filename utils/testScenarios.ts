import { Bot, Message } from '../types';
import { BOTS } from '../constants';

export interface TestScenario {
    id: string;
    name: string;
    description: string;
    bot: Bot;
    chatHistory: Message[];
}

const simpleBot = BOTS.find(b => b.id === 'max-ambitious')!;
const cbtBot = BOTS.find(b => b.id === 'chloe-cbt')!;
const interviewBot = BOTS.find(b => b.id === 'g-interviewer')!;
const chloeBot = BOTS.find(b => b.id === 'chloe-cbt')!; // Same as cbtBot for experimental modes

export const getTestScenarios = (t: (key: string) => string): TestScenario[] => [
    {
        id: 'interview_formatting',
        name: t('scenario_interview_name'),
        description: t('scenario_interview_desc'),
        bot: interviewBot,
        chatHistory: [ 
             { id: '1', role: 'bot', text: t('scenario_interview_chathistory_bot'), timestamp: new Date().toISOString() },
             { id: '2', role: 'user', text: t('scenario_interview_chathistory_user'), timestamp: new Date().toISOString() },
             { id: '3', role: 'bot', text: t('scenario_interview_chathistory_bot2'), timestamp: new Date().toISOString() },
             { id: '4', role: 'user', text: t('scenario_interview_chathistory_user2'), timestamp: new Date().toISOString() },
        ],
    },
    {
        id: 'simple_update',
        name: t('scenario_simple_update_name'),
        description: t('scenario_simple_update_desc'),
        bot: simpleBot,
        chatHistory: [
            { id: '1', role: 'user', text: t('scenario_simple_update_user'), timestamp: new Date().toISOString() },
            { id: '2', role: 'bot', text: t('scenario_simple_update_bot'), timestamp: new Date().toISOString() },
            { id: '3', role: 'user', text: t('scenario_simple_update_user2'), timestamp: new Date().toISOString() },
        ],
    },
    {
        id: 'complex_update',
        name: t('scenario_complex_update_name'),
        description: t('scenario_complex_update_desc'),
        bot: cbtBot,
        chatHistory: [
            { id: '1', role: 'user', text: t('scenario_complex_update_user1'), timestamp: new Date().toISOString() },
            { id: '2', role: 'bot', text: t('scenario_complex_update_bot1'), timestamp: new Date().toISOString() },
            { id: '3', role: 'user', text: t('scenario_complex_update_user2'), timestamp: new Date().toISOString() },
            { id: '4', role: 'bot', text: t('scenario_complex_update_bot2'), timestamp: new Date().toISOString() },
            { id: '5', role: 'user', text: t('scenario_complex_update_user3'), timestamp: new Date().toISOString() },
        ],
    },
    {
        id: 'next_steps',
        name: t('scenario_next_steps_name'),
        description: t('scenario_next_steps_desc'),
        bot: simpleBot,
        chatHistory: [
            { id: '1', role: 'user', text: t('scenario_next_steps_user1'), timestamp: new Date().toISOString() },
            { id: '2', role: 'bot', text: t('scenario_next_steps_bot1'), timestamp: new Date().toISOString() },
            { id: '3', role: 'user', text: t('scenario_next_steps_user2'), timestamp: new Date().toISOString() },
        ],
    },
    {
        id: 'dpc_profile_adaptive',
        name: '🧪 ' + t('scenario_dpc_name'),
        description: t('scenario_dpc_desc'),
        bot: chloeBot,
        chatHistory: [
            { id: '1', role: 'user', text: t('scenario_dpc_user1'), timestamp: new Date().toISOString() },
            { id: '2', role: 'bot', text: t('scenario_dpc_bot1'), timestamp: new Date().toISOString() },
            { id: '3', role: 'user', text: t('scenario_dpc_user2'), timestamp: new Date().toISOString() },
            { id: '4', role: 'bot', text: t('scenario_dpc_bot2'), timestamp: new Date().toISOString() },
            { id: '5', role: 'user', text: t('scenario_dpc_user3'), timestamp: new Date().toISOString() },
        ],
    },
    {
        id: 'dpfl_learning_loop',
        name: '🧪 ' + t('scenario_dpfl_name'),
        description: t('scenario_dpfl_desc'),
        bot: chloeBot,
        chatHistory: [
            { id: '1', role: 'user', text: t('scenario_dpfl_user1'), timestamp: new Date().toISOString() },
            { id: '2', role: 'bot', text: t('scenario_dpfl_bot1'), timestamp: new Date().toISOString() },
            { id: '3', role: 'user', text: t('scenario_dpfl_user2'), timestamp: new Date().toISOString() },
            { id: '4', role: 'bot', text: t('scenario_dpfl_bot2'), timestamp: new Date().toISOString() },
            { id: '5', role: 'user', text: t('scenario_dpfl_user3'), timestamp: new Date().toISOString() },
            { id: '6', role: 'bot', text: t('scenario_dpfl_bot3'), timestamp: new Date().toISOString() },
            { id: '7', role: 'user', text: t('scenario_dpfl_user4'), timestamp: new Date().toISOString() },
        ],
    },
];