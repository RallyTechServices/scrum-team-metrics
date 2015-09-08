#Feature Risk

Feature risk as determined by the color of the feature.  

Current feature risk colors:
        '#107c1e': 'On Track',
        '#df1a7b': 'High Risk',
        '#fce205': 'Moderate Risk',
        '#f9a814': 'High Risk',
        '#ee6c19': 'High Risk'

All other feature colors (or lack of color) are ignored and represented by "Other".  

The number of features represented in the Feature Risk pie should equal the Total number of features minus the delivered features.

Delivered features are features in the "Done" or "Operate" state.  

###Notes
This app relies on the assumption that the lowest level Portfolio Item is a "Feature".  
It also relies on the existence of certain feature and story custom fields as well as the Feature State of Done.  

The dataset used for the calculations in this app is all features in the current project scope that were associated with the selected release at the time of the release start date (which is midnight on the ReleaseStartDate in the default timezone of the workspace).

Planned and Total will be the same for a release with a start date in the future since it will return the features currently associated with the release (if it is before the release start date).
