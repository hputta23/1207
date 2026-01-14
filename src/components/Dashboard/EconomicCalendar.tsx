
import { useState, useEffect } from 'react';

interface EconomicEvent {
    id: string;
    time: string;
    countryCode: string; // 'US'
    impact: 'low' | 'medium' | 'high';
    event: string;
    actual: string;
    consensus: string;
    previous: string;
    status: 'completed' | 'upcoming' | 'live';
    isBetter?: boolean; // For Actual vs Consensus coloring
}

const MOCK_EVENTS: EconomicEvent[] = [
    { id: '1', time: '08:30 AM', countryCode: 'US', impact: 'high', event: 'Core Inflation Rate YoY (DEC)', actual: '3.9%', consensus: '3.8%', previous: '4.0%', status: 'completed', isBetter: false },
    { id: '2', time: '08:30 AM', countryCode: 'US', impact: 'high', event: 'Inflation Rate YoY (DEC)', actual: '3.4%', consensus: '3.2%', previous: '3.1%', status: 'completed', isBetter: false },
    { id: '3', time: '08:30 AM', countryCode: 'US', impact: 'medium', event: 'Core Inflation Rate MoM (DEC)', actual: '0.3%', consensus: '0.3%', previous: '0.3%', status: 'completed', isBetter: true },
    { id: '4', time: '08:30 AM', countryCode: 'US', impact: 'medium', event: 'Initial Jobless Claims', actual: '202K', consensus: '210K', previous: '203K', status: 'completed', isBetter: true },
    { id: '5', time: '10:00 AM', countryCode: 'US', impact: 'low', event: 'Wholesale Inventories MoM', actual: '-0.2%', consensus: '-0.2%', previous: '-0.3%', status: 'completed', isBetter: true },
    { id: '6', time: '02:00 PM', countryCode: 'US', impact: 'high', event: 'Fed Interest Rate Decision', actual: '', consensus: '5.5%', previous: '5.5%', status: 'upcoming' },
    { id: '7', time: '02:30 PM', countryCode: 'US', impact: 'high', event: 'FOMC Press Conference', actual: '', consensus: '', previous: '', status: 'upcoming' },
    { id: '8', time: '04:30 PM', countryCode: 'US', impact: 'low', event: 'API Crude Oil Stock Change', actual: '', consensus: '-1.2M', previous: '-7.4M', status: 'upcoming' },
    { id: '9', time: '08:30 AM', countryCode: 'US', impact: 'high', event: 'PPI MoM (JAN)', actual: '', consensus: '0.1%', previous: '-0.1%', status: 'upcoming' },
    { id: '10', time: '08:30 AM', countryCode: 'US', impact: 'medium', event: 'Retail Sales MoM (JAN)', actual: '', consensus: '0.4%', previous: '0.6%', status: 'upcoming' },
    { id: '11', time: '09:15 AM', countryCode: 'US', impact: 'medium', event: 'Industrial Production MoM', actual: '', consensus: '0.0%', previous: '0.2%', status: 'upcoming' },
    { id: '12', time: '10:00 AM', countryCode: 'US', impact: 'high', event: 'Michigan Consumer Sentiment', actual: '', consensus: '69.0', previous: '69.7', status: 'upcoming' },
];

export function EconomicCalendar() {
    const [events, setEvents] = useState<EconomicEvent[]>(MOCK_EVENTS);
    const [filterImpact, setFilterImpact] = useState<'all' | 'high'>('all');

    const filteredEvents = filterImpact === 'all'
        ? events
        : events.filter(e => e.impact === 'high');

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case 'high': return '#ef4444';
            case 'medium': return '#f97316';
            case 'low': return '#eab308';
            default: return '#94a3b8';
        }
    };

    const getStatusIndicator = (status: string) => {
        if (status === 'live') return <span className="animate-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>;
        if (status === 'completed') return <span style={{ color: '#94a3b8' }}>✓</span>;
        return <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1px solid #64748b', display: 'inline-block' }}></span>;
    };

    return (
        <div style={{
            background: 'linear-gradient(180deg, rgba(20, 20, 30, 0.6) 0%, rgba(10, 10, 20, 0.4) 100%)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            marginTop: '0px', // Connects directly to top component if needed
            padding: '24px',
            borderRadius: '0 0 16px 16px', // Rounded bottom only if attached
            backdropFilter: 'blur(10px)',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>Economic Calendar</h3>
                    <span style={{ fontSize: '12px', color: '#64748b', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>US Market</span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setFilterImpact(prev => prev === 'all' ? 'high' : 'all')}
                        style={{
                            fontSize: '11px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: `1px solid ${filterImpact === 'high' ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                            background: filterImpact === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                            color: filterImpact === 'high' ? '#ef4444' : '#94a3b8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                        High Impact Only
                    </button>
                    {/* Placeholder Date Selector */}
                    <button style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'transparent',
                        color: '#94a3b8',
                        cursor: 'pointer'
                    }}>
                        Today: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </button>
                </div>
            </div>

            <div style={{
                height: '300px',
                overflowY: 'auto',
                paddingRight: '4px',
                // Custom Scrollbar styles will be handled by CSS in Dashboard or Global, but inline styles helps for now
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.1) transparent'
            }} className="custom-scrollbar">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#13131f', zIndex: 10 }}>
                        <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>
                            <th style={{ padding: '8px 4px', fontWeight: 600 }}>Time</th>
                            <th style={{ padding: '8px 4px', fontWeight: 600, textAlign: 'center' }}>Imp</th>
                            <th style={{ padding: '8px 12px', fontWeight: 600 }}>Event</th>
                            <th style={{ padding: '8px 4px', fontWeight: 600, textAlign: 'right' }}>Actual</th>
                            <th style={{ padding: '8px 4px', fontWeight: 600, textAlign: 'right' }}>Consensus</th>
                            <th style={{ padding: '8px 4px', fontWeight: 600, textAlign: 'right' }}>Previous</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEvents.map((e, idx) => (
                            <tr key={e.id} style={{
                                borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                                background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                                transition: 'background 0.2s',
                            }}
                                onMouseEnter={(ev) => ev.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                                onMouseLeave={(ev) => ev.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'}
                            >
                                <td style={{ padding: '10px 4px', color: '#94a3b8', fontFamily: 'monospace' }}>{e.time}</td>
                                <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                                    <div style={{
                                        width: '24px',
                                        height: '4px',
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '2px',
                                        margin: '0 auto',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            bottom: 0,
                                            width: e.impact === 'high' ? '100%' : e.impact === 'medium' ? '66%' : '33%',
                                            background: getImpactColor(e.impact)
                                        }} />
                                    </div>
                                </td>
                                <td style={{ padding: '10px 12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '14px' }}>🇺🇸</span>
                                        <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{e.event}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 600, color: e.actual ? (e.isBetter ? '#22c55e' : '#ef4444') : '#94a3b8' }}>
                                    {e.actual || '--'}
                                </td>
                                <td style={{ padding: '10px 4px', textAlign: 'right', color: '#94a3b8' }}>{e.consensus || '--'}</td>
                                <td style={{ padding: '10px 4px', textAlign: 'right', color: '#64748b' }}>{e.previous || '--'}</td>
                            </tr>
                        ))}
                        {filteredEvents.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No events found for this filter.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
