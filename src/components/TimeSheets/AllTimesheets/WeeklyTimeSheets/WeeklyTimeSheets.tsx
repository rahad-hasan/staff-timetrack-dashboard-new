import WeeklyTimeSheetsTable from "./WeeklyTimeSheetsTable";
import WeeklyDatePicker from "@/components/Common/WeeklyDatePicker";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";

const WeeklyTimeSheets = () => {

    return (
        <div>
            <div className=" mb-5 flex flex-col gap-4 xl:gap-0 xl:flex-row justify-between">
                <div className=" flex gap-3">
                    <WeeklyDatePicker />
                    <div className=" hidden md:block">
                        {/* <Button className="dark:text-darkTextPrimary" variant={'filter'}>
                            <SlidersHorizontal className=" dark:text-darkTextPrimary" /> Filters
                        </Button> */}
                        <SelectProjectDropDown></SelectProjectDropDown>
                    </div>
                </div>
                <SelectUserDropDown></SelectUserDropDown>
            </div>

            <WeeklyTimeSheetsTable></WeeklyTimeSheetsTable>
        </div>
    );
};

export default WeeklyTimeSheets;