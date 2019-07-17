import * as React from 'react'
import { StyleSheet } from 'react-native'
import CoverAction from 'src/dev/CoverAction'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import { CeloLinks } from 'src/shared/menu-items'
import { standardStyles } from 'src/styles'
const docImage = require('src/dev/Documentation.png')
const faucetImage = require('src/dev/Faucet.png')
const walletImage = require('src/dev/Wallet.png')

type Props = I18nProps & ScreenProps

export default withNamespaces('dev')(
  withScreenSize<Props>(function CoverActions({ t, screen }: Props) {
    return (
      <GridRow
        desktopStyle={standardStyles.sectionMarginBottom}
        tabletStyle={standardStyles.sectionMarginBottomTablet}
        mobileStyle={standardStyles.sectionMarginMobile}
      >
        <Cell
          span={Spans.full}
          style={screen === ScreenSizes.MOBILE ? styles.mainMobile : styles.main}
        >
          <CoverAction
            graphic={docImage}
            isMobile={screen === ScreenSizes.MOBILE}
            title={t('coverAction.docs.title')}
            text={t('coverAction.docs.text')}
            link={{ text: t('coverAction.docs.link'), href: CeloLinks.docs }}
          />

          <CoverAction
            graphic={faucetImage}
            isMobile={screen === ScreenSizes.MOBILE}
            title={t('coverAction.faucet.title')}
            text={t('coverAction.faucet.text')}
            link={{ text: t('coverAction.faucet.link'), href: CeloLinks.faucet }}
          />
          <CoverAction
            graphic={walletImage}
            isMobile={screen === ScreenSizes.MOBILE}
            title={t('coverAction.code.title')}
            text={t('coverAction.code.text')}
            link={{ text: t('coverAction.code.link'), href: CeloLinks.gitHub }}
          />
        </Cell>
      </GridRow>
    )
  })
)

const styles = StyleSheet.create({
  main: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainMobile: { justifyContent: 'space-around' },
})
