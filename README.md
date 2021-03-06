#Scrum Team Metrics

App that shows various feature metrics for features within the selected release.  

![Screenshot](/images/scrum-team-metrics.png)

Metrics shown are:

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
The number of current features that are completed (State = Done)

#####Delivered Features with Incomplete DoD stories
The number of current features that are completed but have incomplete DoD stories.  DoD stories are any stories of the DoD Story type that belong to that feature.  

#####% Delivered Stories
The total number of features delivered divided by the number of Planned features (note NOT the number of total features).

#####% Accepted Stories
The percent of leaf user stories associated with the total Feature dataset that have been accepted.  

#####Feature Risk
Feature risk as determined by the color of the feature.  Features colored Green are considered On Track, features colored Yellow are considered moderate risk and features colored Pink or Orange are considered High Risk.  All other feature colors (or lack of color) are ignored and represented by "Other".  Feature Risk is shown only for feature items that are not in the "Done" State.
The number of features represented in the Feature Risk pie should equal the Total number of features minus the delivered features.

#####Features Pushed into Target Sprint
Number of features pushed out of the target sprint.  Target Sprint is a custom field on the feature that is used to plan for the feature time frame.
If a feature is pushed out of 2 target sprints, it will show up in the graph for each time it is pushed.  

#####Feature Cycle Time
Currently, this is calculated as the difference in time from either the Release Start Date (if the feature was associated with the release on the first day of the release), or the day the feature was added to the release (if after the Release Start Date) to the (latest) day that the feature is transitioned into the Done state. 


###Notes
This app relies on the assumption that the lowest level Portfolio Item is a "Feature".  
It also relies on the existence of certain feature and story custom fields as well as the Feature State of Done.  

The dataset used for the calculations in this app is all features in the current project scope that were associated with the selected release at the time of the release start date (which is midnight on the ReleaseStartDate in the default timezone of the workspace).

Planned and Total will be the same for a release with a start date in the future since it will return the features currently associated with the release (if it is before the release start date).