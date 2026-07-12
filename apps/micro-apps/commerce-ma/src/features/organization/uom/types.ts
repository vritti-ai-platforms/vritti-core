// Route union for the UOM navigator. The per-dimension units list will be added to the detail screen
// once its design lands.
export type UomRoute = 'UomDimensionsList' | 'UomDimensionDetail';

// The detail screen takes the dimension id (reads it live from the cache, so edits reflect immediately).
export interface UomDimensionDetailParams {
  id: string;
}

// PushNavigator.push is param-less, so screens navigate via React Navigation's navigate directly.
export type UomNavigation = {
  navigate: (screen: 'UomDimensionDetail', params: UomDimensionDetailParams) => void;
  goBack: () => void;
};
