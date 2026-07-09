import { SetMetadata } from '@nestjs/common';

export const REQUIRE_FEATURE_KEY = 'require_feature';
export const SKIP_FEATURE_KEY = 'skip_feature';

// Marks a controller/route as requiring the given feature switch to be on (e.g. 'categories')
export const RequireFeature = (feature: string) => SetMetadata(REQUIRE_FEATURE_KEY, feature);

// Opts a route out of the class-level feature switch (e.g. a cross-feature select/picker)
export const SkipFeature = () => SetMetadata(SKIP_FEATURE_KEY, true);
