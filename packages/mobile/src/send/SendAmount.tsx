import { getStableTokenContract } from '@celo/contractkit/src/contracts'
import { Avatar } from '@celo/react-components/components/Avatar'
import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import { parseInputAmount } from '@celo/utils/src/parsing'
import BigNumber from 'bignumber.js'
import { debounce } from 'lodash'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { NavigationInjectedProps, NavigationScreenProps } from 'react-navigation'
import { connect } from 'react-redux'
import { hideAlert, showError, showMessage } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ERROR_BANNER_DURATION, INPUT_DEBOUNCE_TIME } from 'src/config'
import { Namespaces } from 'src/i18n'
import { fetchPhoneAddresses } from 'src/identity/actions'
import {
  getRecipientAddress,
  getRecipientVerificationStatus,
  VerificationStatus,
} from 'src/identity/contactMapping'
import { E164NumberToAddressType } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { updateSuggestedFee } from 'src/send/actions'
import LabeledTextInput from 'src/send/LabeledTextInput'
import { getSuggestedFeeDollars } from 'src/send/selectors'
import { CeloDefaultRecipient } from 'src/send/Send'
import { ConfirmationInput } from 'src/send/SendConfirmation'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { fetchDollarBalance } from 'src/stableToken/actions'
import Logger from 'src/utils/Logger'
import { Recipient, RecipientKind } from 'src/utils/recipient'

const TAG: string = 'send/SendAmount'

const MAX_COMMENT_LENGTH = 70

interface State {
  amount: string
  reason: string
  numberOfDecimals: number
  characterLimitExeeded: boolean
}

type Props = StateProps & DispatchProps & NavigationInjectedProps & WithNamespaces

interface StateProps {
  dollarBalance: BigNumber | null
  suggestedFeeDollars: BigNumber
  defaultCountryCode: string
  e164NumberToAddress: E164NumberToAddressType
}

interface DispatchProps {
  fetchDollarBalance: typeof fetchDollarBalance
  showMessage: typeof showMessage
  showError: typeof showError
  hideAlert: typeof hideAlert
  updateSuggestedFee: typeof updateSuggestedFee
  fetchPhoneAddresses: typeof fetchPhoneAddresses
}

const mapStateToProps = (state: RootState): StateProps => ({
  dollarBalance: state.stableToken.balance ? new BigNumber(state.stableToken.balance) : null,
  suggestedFeeDollars: getSuggestedFeeDollars(state),
  defaultCountryCode: state.account.defaultCountryCode,
  e164NumberToAddress: state.identity.e164NumberToAddress,
})

export class SendAmount extends React.PureComponent<Props, State> {
  static navigationOptions = ({ navigation }: NavigationScreenProps) => ({
    headerTitle: navigation.getParam('title', ''),
    headerTitleStyle: [fontStyles.headerTitle, componentStyles.screenHeader],
    headerRight: <View />, // This helps vertically center the title
  })

  state: State = {
    amount: '',
    reason: '',
    numberOfDecimals: 2,
    characterLimitExeeded: false,
  }

  amountInput: React.RefObject<TextInput>
  timeout: number | null = null
  calculateFeeDebounced: (() => void)

  constructor(props: Props) {
    super(props)
    this.amountInput = React.createRef<TextInput>()
    this.calculateFeeDebounced = debounce(this.calculateFee, INPUT_DEBOUNCE_TIME)
  }

  componentDidMount() {
    this.props.navigation.setParams({ title: this.props.t('send_or_request') })
    this.props.fetchDollarBalance()
    this.fetchLatestPhoneAddress()
  }

  componentDidUpdate(prevProps: Props) {
    if (
      this.getVerificationStatus(prevProps.e164NumberToAddress) === VerificationStatus.UNKNOWN &&
      this.getVerificationStatus() !== VerificationStatus.UNKNOWN
    ) {
      this.calculateFeeDebounced()
    }
  }

  calculateFee = () => {
    if (this.amountGreatherThanBalance()) {
      // No need to update fee as the user doesn't have enough anyways
      return
    }

    const verificationStatus = this.getVerificationStatus()
    if (verificationStatus === VerificationStatus.UNKNOWN) {
      // Wait for verification status before calculating fee
      return
    }

    Logger.debug(TAG, 'Updating fee')
    const params = {
      // Just use a default here since it doesn't matter for fee estimation
      recipientAddress: CeloDefaultRecipient.address!,
      amount: parseInputAmount(this.state.amount).toString(),
      comment: this.state.reason,
    }

    this.props.updateSuggestedFee(
      verificationStatus === VerificationStatus.VERIFIED,
      getStableTokenContract,
      params
    )
  }

  componentWillUnmount() {
    this.props.hideAlert()
  }

  amountGreatherThanBalance = () => {
    return parseInputAmount(this.state.amount).isGreaterThan(this.props.dollarBalance || 0)
  }

  getAmountIsValid = () => {
    const bigNumberAmount: BigNumber = parseInputAmount(this.state.amount)
    const amountWithFees: BigNumber = bigNumberAmount.plus(this.props.suggestedFeeDollars)
    const currentBalance = this.props.dollarBalance
      ? new BigNumber(this.props.dollarBalance)
      : new BigNumber(0)

    const amountIsValid = bigNumberAmount.isGreaterThan(0)
    const userHasEnough = amountWithFees.isLessThanOrEqualTo(currentBalance)
    return { amountIsValid, userHasEnough }
  }

  getRecipient = (): Recipient => {
    const recipient = this.props.navigation.getParam('recipient')
    if (!recipient) {
      throw new Error('Recipient expected')
    }
    return recipient
  }

  getVerificationStatus = (e164NumberToAddress?: E164NumberToAddressType) => {
    return getRecipientVerificationStatus(
      this.getRecipient(),
      e164NumberToAddress || this.props.e164NumberToAddress
    )
  }

  onAmountChanged = (amount: string) => {
    this.setState({ amount })
    this.calculateFeeDebounced()
  }

  onReasonChanged = (reason: string) => {
    let characterLimitExeeded
    if (reason.length > MAX_COMMENT_LENGTH) {
      this.props.showMessage(this.props.t('characterLimitExceeded', { max: MAX_COMMENT_LENGTH }))

      characterLimitExeeded = true
    } else {
      this.props.hideAlert()
      characterLimitExeeded = false
    }

    this.setState({ reason, characterLimitExeeded })
    this.calculateFeeDebounced()
  }

  getConfirmationInput = () => {
    const amount = parseInputAmount(this.state.amount)
    const recipient = this.getRecipient()
    const recipientAddress = getRecipientAddress(recipient, this.props.e164NumberToAddress)

    const confirmationInput: ConfirmationInput = {
      recipient,
      amount,
      reason: this.state.reason,
      recipientAddress,
      fee: this.props.suggestedFeeDollars,
    }
    return confirmationInput
  }

  onSend = () => {
    CeloAnalytics.track(CustomEventNames.send_continue)
    this.props.hideAlert()
    const { amountIsValid, userHasEnough } = this.getAmountIsValid()
    const verificationStatus = this.getVerificationStatus()

    // TODO(Rossy) this almost never shows because numeral is swalling the errors
    // and returning 0 for invalid numbers
    if (!amountIsValid) {
      this.props.showError(ErrorMessages.INVALID_AMOUNT, ERROR_BANNER_DURATION)
      return
    }

    if (!userHasEnough) {
      this.props.showError(ErrorMessages.NSF_TO_SEND, ERROR_BANNER_DURATION)
      return
    }

    const confirmationInput = this.getConfirmationInput()
    if (verificationStatus === VerificationStatus.VERIFIED) {
      CeloAnalytics.track(CustomEventNames.transaction_details, {
        recipientAddress: confirmationInput.recipientAddress,
      })
    } else {
      CeloAnalytics.track(CustomEventNames.send_invite_details)
    }
    navigate(Screens.SendConfirmation, { confirmationInput })
  }

  onRequest = () => {
    CeloAnalytics.track(CustomEventNames.request_payment_continue)
    const confirmationInput = this.getConfirmationInput()
    CeloAnalytics.track(CustomEventNames.send_invite_details, {
      requesteeAddress: confirmationInput.recipientAddress,
    })
    navigate(Screens.RequestConfirmation, { confirmationInput })
  }

  renderButtons = (amountIsValid: boolean, userHasEnough: boolean) => {
    const { t } = this.props
    const { characterLimitExeeded } = this.state
    const verificationStatus = this.getVerificationStatus()

    const requestDisabled =
      !amountIsValid || verificationStatus !== VerificationStatus.VERIFIED || characterLimitExeeded
    const sendDisabled =
      !amountIsValid ||
      !userHasEnough ||
      characterLimitExeeded ||
      verificationStatus === VerificationStatus.UNKNOWN

    const separatorContainerStyle =
      sendDisabled && requestDisabled
        ? style.separatorContainerInactive
        : style.separatorContainerActive
    const separatorStyle =
      sendDisabled && requestDisabled ? style.buttonSeparatorInactive : style.buttonSeparatorActive

    return (
      <View style={[componentStyles.bottomContainer, style.buttonContainer]}>
        {verificationStatus !== VerificationStatus.UNVERIFIED && (
          <View style={style.button}>
            <Button
              onPress={this.onRequest}
              text={t('request')}
              accessibilityLabel={t('request')}
              standard={false}
              type={BtnTypes.PRIMARY}
              disabled={requestDisabled}
            />
          </View>
        )}
        <View style={[style.separatorContainer, separatorContainerStyle]}>
          <View style={[style.buttonSeparator, separatorStyle]} />
        </View>
        <View style={style.button}>
          <Button
            onPress={this.onSend}
            text={verificationStatus === VerificationStatus.VERIFIED ? t('send') : t('invite')}
            accessibilityLabel={t('send')}
            standard={false}
            type={BtnTypes.PRIMARY}
            disabled={sendDisabled}
          />
        </View>
      </View>
    )
  }

  fetchLatestPhoneAddress = () => {
    const recipient = this.getRecipient()
    if (recipient.kind === RecipientKind.QrCode) {
      // Skip for QR codes
      return
    }
    if (!recipient.e164PhoneNumber) {
      throw new Error('Missing recipient e164Number')
    }
    this.props.fetchPhoneAddresses([recipient.e164PhoneNumber])
  }

  focusAmountField = () => {
    if (this.amountInput.current) {
      this.amountInput.current.focus()
    }
  }

  renderBottomContainer = (amountIsValid: boolean, userHasEnough: boolean) => {
    const onPress = () => this.focusAmountField()

    if (!amountIsValid) {
      return (
        <TouchableWithoutFeedback onPress={onPress}>
          {this.renderButtons(amountIsValid, userHasEnough)}
        </TouchableWithoutFeedback>
      )
    }
    return this.renderButtons(amountIsValid, userHasEnough)
  }

  render() {
    const { t } = this.props
    const recipient = this.getRecipient()
    const { amountIsValid, userHasEnough } = this.getAmountIsValid()
    const verificationStatus = this.getVerificationStatus()

    return (
      <View style={style.body}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="always"
          contentContainerStyle={style.scrollViewContentContainer}
        >
          <DisconnectBanner />
          <Avatar
            name={recipient.displayName}
            address={recipient.address}
            e164Number={recipient.e164PhoneNumber}
            defaultCountryCode={this.props.defaultCountryCode}
            iconSize={40}
          />
          {verificationStatus === VerificationStatus.UNKNOWN && (
            <View style={style.verificationStatusContainer}>
              <Text style={[fontStyles.bodySmall]}>{t('loadingVerificationStatus')}</Text>
              <ActivityIndicator style={style.loadingIcon} size="small" color={colors.celoGreen} />
            </View>
          )}
          {verificationStatus === VerificationStatus.UNVERIFIED && (
            <Text style={[style.inviteDescription, fontStyles.bodySmall]}>
              {t('inviteMoneyEscrow')}
            </Text>
          )}
          <LabeledTextInput
            ref={this.amountInput}
            keyboardType="numeric"
            title={'$'}
            placeholder={t('amount')}
            labelStyle={style.amountLabel as TextStyle}
            placeholderColor={colors.celoGreenInactive}
            value={this.state.amount}
            onValueChanged={this.onAmountChanged}
            autoFocus={true}
            numberOfDecimals={this.state.numberOfDecimals}
          />
          <LabeledTextInput
            keyboardType="default"
            title={t('for')}
            placeholder={t('groceriesRent')}
            value={this.state.reason}
            onValueChanged={this.onReasonChanged}
          />
        </KeyboardAwareScrollView>
        {this.renderBottomContainer(amountIsValid, userHasEnough)}
      </View>
    )
  }
}

const style = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: 'white',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  scrollViewContentContainer: {
    justifyContent: 'space-between',
  },
  avatar: {
    marginTop: 10,
    alignSelf: 'center',
    margin: 'auto',
  },
  label: {
    alignSelf: 'center',
    color: colors.dark,
  },
  inviteDescription: {
    paddingHorizontal: 65,
    marginVertical: 10,
    textAlign: 'center',
  },
  sendContainer: {
    paddingVertical: 10,
  },
  sendToLabel: {
    color: colors.darkSecondary,
  },
  sendToLabelDark: {
    color: colors.dark,
  },
  amountLabel: {
    color: colors.celoGreen,
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  button: {
    flex: 1,
  },
  separatorContainer: {
    height: 50,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  separatorContainerInactive: {
    backgroundColor: colors.celoGreenInactive,
  },
  separatorContainerActive: {
    backgroundColor: colors.celoGreen,
  },
  buttonSeparatorInactive: {
    backgroundColor: colors.celoDarkGreenInactive,
  },
  buttonSeparatorActive: {
    backgroundColor: colors.celoDarkGreen,
  },
  buttonSeparator: {
    width: 2,
    height: 40,
  },
  verificationStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  loadingIcon: {
    marginHorizontal: 5,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    {
      fetchDollarBalance,
      showError,
      hideAlert,
      updateSuggestedFee,
      showMessage,
      fetchPhoneAddresses,
    }
  )(withNamespaces(Namespaces.sendFlow7)(SendAmount))
)
