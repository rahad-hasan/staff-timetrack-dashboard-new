"use client";
import SearchBar from '@/components/Common/SearchBar';

interface Props {
    onSearchChange: (value: string) => void;
}

const AttendanceHeroSearch = ({ onSearchChange }: Props) => {
    return (
        <div>
            <SearchBar onSearch={onSearchChange} />
        </div>
    );
};

export default AttendanceHeroSearch;