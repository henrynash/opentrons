// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card } from '@opentrons/components'

import { getConfig } from '../../config'
import {
  changeCustomLabwareDirectory,
  addCustomLabware,
  clearAddCustomLabwareFailure,
  getAddLabwareFailure,
} from '../../custom-labware'

import { CardCopy } from '../layout'
import { ManagePath } from './ManagePath'
import { AddLabware } from './AddLabware'
import { PortaledAddLabwareFailureModal } from './AddLabwareFailureModal'

import type { Dispatch } from '../../types'

// TODO(mc, 2019-10-17): i18n
const LABWARE_MANAGEMENT = 'Labware Management'
const MANAGE_CUSTOM_LABWARE_DEFINITIONS =
  'Manage custom labware definitions for use in your Python Protocol API Version 2 protocols.'

export function AddLabwareCard() {
  const dispatch = useDispatch<Dispatch>()
  const config = useSelector(getConfig)
  const addFailure = useSelector(getAddLabwareFailure)
  const labwarePath = config.labware.directory
  const handleChangePath = () => dispatch(changeCustomLabwareDirectory())
  const handleAddLabware = () => dispatch(addCustomLabware())
  const showAddFailure = addFailure.file || addFailure.errorMessage !== null

  return (
    <Card title={LABWARE_MANAGEMENT}>
      <CardCopy>{MANAGE_CUSTOM_LABWARE_DEFINITIONS}</CardCopy>
      <ManagePath path={labwarePath} onChangePath={handleChangePath} />
      <AddLabware onAddLabware={handleAddLabware} />
      {showAddFailure && (
        <PortaledAddLabwareFailureModal
          {...addFailure}
          directory={labwarePath}
          onCancel={() => dispatch(clearAddCustomLabwareFailure())}
          onOverwrite={file => dispatch(addCustomLabware(file))}
        />
      )}
    </Card>
  )
}
