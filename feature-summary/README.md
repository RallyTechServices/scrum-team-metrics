#Feature Summary

#####Total Features
The total number of features explicitly associated with the selected release at the time that the report is run.  

#####Planned Features
The number of features explicitly associated with the selected release on the start day and time of the release.  

#####Added Features
The number of unique features that are currently in the release that were not in the release at the start day and time of the release.  

#####Descoped Features
The number of unique features that are not currently associated with the release (or were not currently associated with the release on the Release End Date) but were associated with the release on the start day of the release.  

Added and Descoped features will always be 0 for a release with a start date in the future.

#####Delivered Features
The number of current features that are completed (State = "Done" or State = "Operate")

###Notes
This app relies on the assumption that the lowest level Portfolio Item is a "Feature".  
It also relies on the existence of certain feature and story custom fields as well as the Feature State of Done.  

The dataset used for the calculations in this app is all features in the current project scope that were associated with the selected release at the time of the release start date (which is midnight on the ReleaseStartDate in the default timezone of the workspace).

Planned and Total will be the same for a release with a start date in the future since it will return the features currently associated with the release (if it is before the release start date).