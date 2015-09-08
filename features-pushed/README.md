#Features Pushed

#####Features Pushed into Target Sprint
Number of features pushed out of the target sprint.  Target Sprint is a custom field on the feature that is used to plan for the feature time frame.
If a feature is pushed out of 2 target sprints, it will show up in the graph for each time it is pushed.  

###Notes
This app relies on the assumption that the lowest level Portfolio Item is a "Feature".  
It also relies on the existence of certain feature and story custom fields as well as the Feature State of Done.  

The dataset used for the calculations in this app is all features in the current project scope that were associated with the selected release at the time of the release start date (which is midnight on the ReleaseStartDate in the default timezone of the workspace).

Planned and Total will be the same for a release with a start date in the future since it will return the features currently associated with the release (if it is before the release start date).