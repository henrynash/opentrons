// @flow
import cloneDeep from 'lodash/cloneDeep'
import { getNextRobotStateAndWarnings } from '../getNextRobotStateAndWarnings'
import type { Command } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type {
  InvariantContext,
  RobotState,
  CommandCreatorError,
  CommandCreatorWarning,
  CommandCreatorResult,
  CurriedCommandCreator,
} from '../types'

type CCReducerAcc = {|
  robotState: RobotState,
  commands: Array<Command>,
  errors: Array<CommandCreatorError>,
  warnings: Array<CommandCreatorWarning>,
|}

export const reduceCommandCreators = (
  commandCreators: Array<CurriedCommandCreator>,
  invariantContext: InvariantContext,
  initialRobotState: RobotState
): CommandCreatorResult => {
  console.log('starting reduceCommandCreators', Date.now())
  let updatesTimeDeltas = []
  const result = commandCreators.reduce(
    (prev: CCReducerAcc, reducerFn: CurriedCommandCreator): CCReducerAcc => {
      // console.log('reduceCommandCreators > inner loop', reducerFn, Date.now())
      if (prev.errors.length > 0) {
        // if there are errors, short-circuit the reduce
        return prev
      }
      const next = reducerFn(invariantContext, prev.robotState)
      if (next.errors) {
        return {
          robotState: prev.robotState,
          commands: prev.commands,
          errors: next.errors,
          warnings: prev.warnings,
        }
      }

      const allCommands = [...prev.commands, ...next.commands]
      const prevTime = Date.now()
      const updates = getNextRobotStateAndWarnings(
        allCommands,
        invariantContext,
        initialRobotState
      )
      updatesTimeDeltas.push(Date.now() - prevTime)
      return {
        ...prev,
        robotState: updates.robotState,
        commands: allCommands,
        warnings: [
          ...(prev.warnings || []),
          ...(next.warnings || []),
          ...updates.warnings,
        ],
      }
    },
    {
      robotState: cloneDeep(initialRobotState),
      commands: [],
      errors: [],
      warnings: [],
    }
  )
  console.log('done reduceCommandCreators', Date.now(), updatesTimeDeltas)
  if (result.errors.length > 0) {
    return { errors: result.errors }
  }
  return { commands: result.commands, warnings: result.warnings }
}
