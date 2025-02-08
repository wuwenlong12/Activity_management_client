import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { school } from '../../api/school/type';

interface SchoolState {
  selectedSchool: school | null;
  schools: school[];
}

const initialState: SchoolState = {
  selectedSchool: null,
  schools: [],
};

const schoolSlice = createSlice({
  name: 'school',
  initialState,
  reducers: {
    setSelectedSchool: (state, action: PayloadAction<school>) => {
      state.selectedSchool = action.payload;
    },
    setSchools: (state, action: PayloadAction<school[]>) => {
      state.schools = action.payload;
      if (!state.selectedSchool && action.payload.length > 0) {
        state.selectedSchool = action.payload[0];
      }
    },
  },
});

export const { setSelectedSchool, setSchools } = schoolSlice.actions;
export default schoolSlice.reducer; 