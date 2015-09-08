#Features Delivered

#####Delivered Features with Incomplete DoD stories
The number of current features that are completed (State = Done or State = Operate) but have incomplete DoD stories.  DoD stories are any stories of the DoD Story type that belong to that feature.  

#####% Delivered Stories
The total number of features delivered divided by the number of Total features.

###Notes
This app relies on the assumption that the lowest level Portfolio Item is a "Feature".  
It also relies on the existence of certain feature and story custom fields as well as the Feature State of Done.  

The dataset used for the calculations in this app is all features in the current project scope that were associated with the selected release at the time of the release start date (which is midnight on the ReleaseStartDate in the default timezone of the workspace).

Planned and Total will be the same for a release with a start date in the future since it will return the features currently associated with the release (if it is before the release start date).