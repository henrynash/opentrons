// @flow
import { createSelector } from 'reselect'

import { selectors as stepFormSelectors } from '../step-forms'
import { selectors as fileDataSelectors } from '../file-data'

import { generateSubsteps } from '../steplist/generateSubsteps' // TODO Ian 2018-04-11 move generateSubsteps closer to this substeps.js file?

import type { Selector } from '../types'
import type { StepIdType } from '../form-types'
import type { SubstepItemData } from '../steplist/types'

type AllSubsteps = { [StepIdType]: ?SubstepItemData }
export const allSubsteps: Selector<AllSubsteps> = createSelector(
  stepFormSelectors.getArgsAndErrorsByStepId,
  stepFormSelectors.getInvariantContext,
  stepFormSelectors.getOrderedStepIds,
  fileDataSelectors.getRobotStateTimeline,
  fileDataSelectors.getInitialRobotState,
  (
    allStepArgsAndErrors,
    invariantContext,
    orderedStepIds,
    robotStateTimeline,
    _initialRobotState
  ) => {
    console.log('allSubsteps starting', Date.now())
    const timeline = [
      { robotState: _initialRobotState },
      ...robotStateTimeline.timeline,
    ]
    const result = orderedStepIds.reduce(
      (acc: AllSubsteps, stepId, timelineIndex) => {
        const robotState =
          timeline[timelineIndex] && timeline[timelineIndex].robotState

        console.log('allSubsteps > generate substeps for', stepId, Date.now())
        const substeps = generateSubsteps(
          allStepArgsAndErrors[stepId],
          invariantContext,
          robotState,
          stepId
        )
        console.log('generated for', stepId, Date.now())

        return {
          ...acc,
          [stepId]: substeps,
        }
      },
      {}
    )
    console.log('done allSubsteps', Date.now())
    return result
  }
)
