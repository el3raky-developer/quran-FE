import type { Participant } from '../shared/@types';
import type { CompetitionData } from '../lib/api';

export type ReportParticipant = Participant & {
    qraatLevel?: any;
    qraat_level?: any;
};

export function normalizeArabic(text: string) {
    return text
        .replace(/[\u064B-\u065F]/g, '')
        .replace(/[أإآ]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه')
        .trim();
}

export function isQraat(p: any) {
    return (
        p?.qraatLevel != null ||
        p?.qraat_level != null ||
        p?.category === 'qraat'
    );
}

export function getParticipantQraatLevelId(p: any): string | null {
    if (!p) return null;
    if (p.qraatLevel && typeof p.qraatLevel === 'object') return p.qraatLevel._id ?? null;
    if (p.qraat_level && typeof p.qraat_level === 'string') return p.qraat_level;
    if (p.qraatLevel && typeof p.qraatLevel === 'string') return p.qraatLevel;
    if (p.levelNumber != null) return String(p.levelNumber);
    return null;
}

export function qraatLevelItems(competition: CompetitionData | null) {
    const raw =
        (competition as any)?.qraat_levels ??
        (competition as any)?.qraatLevels ??
        [];
    if (!raw || !raw.length) return [];
    if (typeof raw[0] === 'object' && raw[0] !== null && 'title' in raw[0]) {
        return (raw as any[]).map((level) => ({
            title: level.title,
            value: level._id,
        }));
    }
    return (raw as string[]).map((id) => ({ title: id, value: id }));
}

export function getParticipantQraatTitle(p: any, competition: CompetitionData | null) {
    if (!p) return '-';
    if (p.qraatLevel && typeof p.qraatLevel === 'object' && p.qraatLevel.title)
        return p.qraatLevel.title;

    const raw =
        (competition as any)?.qraat_levels ??
        (competition as any)?.qraatLevels ??
        [];
    const id = getParticipantQraatLevelId(p);
    if (!id) return '-';
    if (Array.isArray(raw) && raw.length) {
        const found = (raw as any[]).find((r) =>
            typeof r === 'object' ? r._id === id : r === id
        );
        if (found)
            return typeof found === 'object'
                ? found.title ?? String(found)
                : String(found);
    }
    return String(id);
}
