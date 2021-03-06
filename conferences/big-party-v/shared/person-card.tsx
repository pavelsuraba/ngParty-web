import { ReactElement } from 'react'

import { utils } from '../../../shared'
import { TwitterIcon, LinkedInIcon, GithubIcon } from '../../../components'

import { LinkModel } from '../data'

import { stripTrailingSlash } from './utils'

import { styles, lightboxStyles } from './person-cards.styles'

interface PersonModel {
  id: string
  name: string
  img: string
  social: SocialLinks
}
interface SpeakerTalkModel {
  title: string
  abstract: string
  media: {
    slides: string
    video: string
  }
}
export interface SpeakerModel extends PersonModel {
  company: string
  jobTitle: string
  country: string
  about: string
  talk: SpeakerTalkModel
}
export interface OrganizerModel extends PersonModel {
  role: Array<'founder' | 'organizer'>
}

function isOrganizer(
  value: Partial<SpeakerModel & OrganizerModel>
): value is OrganizerModel {
  return Boolean(value.role)
}
function isSpeaker(
  value: Partial<SpeakerModel & OrganizerModel>
): value is SpeakerModel {
  return Boolean(
    value.about && value.talk && value.jobTitle && utils.isString(value.company)
  )
}

export const PersonCard = (props: SpeakerModel | OrganizerModel) => {
  const normalizedSocial = formatSocialHandles(props.social)
  const modalId = `${props.id}-detail`
  const openModalHandler = `tap:${modalId}`
  const closeModalHandler = `${openModalHandler}.close`

  const modelNarrowedProps = isSpeaker(props)
    ? {
        title: (
          <>
            {props.jobTitle}
            <br />
            <PersonCompanyLabel
              className="card-company"
              company={props.company}
            />
          </>
        ),
        children: (
          <h3 className="card-talk-title">
            <small className="card-talk-title__icon" title="Talk title">
              🎤{' '}
            </small>
            <span>{props.talk.title}</span>
          </h3>
        ),
        hoverStyle: 'translate' as const,
        onTap: () => openModalHandler,
        detail: {
          ...props,
          social: normalizedSocial,
          id: modalId,
          onClose: () => closeModalHandler,
        },
      }
    : {
        title: formatRole(props.role),
        children: <SocialLinkList data={normalizedSocial} />,
        hoverStyle: 'scale' as const,
        onTap: undefined,
        detail: null,
      }

  const { detail: detailProps, ...normalizedProps } = modelNarrowedProps
  const infoProps: PersonCardInfoProps = {
    id: props.id,
    name: props.name,
    img: props.img,
    ...normalizedProps,
  }

  return (
    <>
      <style jsx global>
        {styles}
      </style>
      <style jsx global>
        {lightboxStyles}
      </style>
      <PersonCardInfo {...infoProps} />
      {detailProps ? <PersonLightbox {...detailProps} /> : null}
    </>
  )
}

type PersonCardInfoProps = {
  id: string
  img: string
  name: string
  title: string | ReactElement
  onTap?: () => string
  children?: JSX.Element | JSX.Element[] | null
  hoverStyle: 'scale' | 'translate'
}
const PersonCardInfo = (props: PersonCardInfoProps) => {
  const { img, name: fullName, title, onTap, children, hoverStyle, id } = props
  const isTapable = Boolean(onTap)

  const cx = {
    root: hoverStyle === 'scale' ? 'card-scale' : 'card-translate',
  }

  return (
    <section
      id={id}
      style={{ cursor: isTapable ? 'pointer' : 'auto' }}
      className={`card ${cx.root}`}
      on={onTap ? onTap() : ''}
      tabIndex={0}
      role="button"
    >
      <amp-img
        className="card-img"
        layout="responsive"
        src={img}
        width="200"
        height="200"
      ></amp-img>
      <div className="card-info">
        <h2 className="card-heading">{fullName}</h2>
        <p className="card-title">{title}</p>
        {children ? <div className="card-extra-content">{children}</div> : null}
      </div>
    </section>
  )
}

type PersonLightBoxProps = {
  id: string
  name: string
  jobTitle: string
  company: string
  about: string
  social: NormalizedSocialLinkMap
  talk: SpeakerTalkModel
  onClose: () => string
}
const PersonLightbox = (props: PersonLightBoxProps) => {
  const {
    id,
    name: fullName,
    jobTitle,
    company,
    about,
    social,
    talk,
    onClose,
  } = props
  const hasTalkReady = Boolean(talk.title)

  return (
    <amp-lightbox id={id} layout="nodisplay" scrollable>
      <div className="lightbox" role="button" on={onClose()} tabIndex={0}>
        <div className="lightbox-content">
          <h2 className="lightbox-headline">{fullName}</h2>
          <h3 className="lightbox-subtitle">
            {jobTitle} <PersonCompanyLabel company={company} />
          </h3>
          <p className="lightbox-social">
            <SocialLinkList data={social} showLabel />
          </p>
          <p className="lightbox-bio">{about}</p>

          {hasTalkReady ? (
            <section className="lightbox-talk">
              <h2 className="lightbox-talk__title">
                <small title="Talk title">🎤 </small>
                {talk.title}
              </h2>
              <div
                className="lightbox-talk__abstract"
                dangerouslySetInnerHTML={{ __html: talk.abstract }}
              />
            </section>
          ) : null}
        </div>
      </div>
    </amp-lightbox>
  )
}

const SocialLink = (props: NormalizedSocialLink & { showLabel?: boolean }) => {
  const { Ico, label, link, showLabel } = props
  return (
    <a href={link} target="_blank" rel="noopener noreferrer">
      <Ico width={'1em'} />
      {showLabel ? label : false}
    </a>
  )
}
const SocialLinkList = (props: {
  data: NormalizedSocialLinkMap
  showLabel?: boolean
}) => {
  const { data, showLabel } = props
  const view = Object.entries(data).map(([id, item]) => {
    return item.link ? (
      <SocialLink key={id} {...item} showLabel={showLabel} />
    ) : null
  })

  return <>{view}</>
}

const PersonCompanyLabel = (props: {
  company: string | ''
  className?: string
}) => {
  return props.company ? (
    <span className={props.className}>at {props.company}</span>
  ) : null
}

const formatRole = (role: OrganizerModel['role']) => {
  return role.map((item) => utils.capitalize(item)).join(', ')
}

const transformSpeakerName = (name: string) => {
  const [firstName, lastName] = name.split(' ')

  return { firstName, lastName }
}

export type SocialLinks = Record<keyof typeof socialData, string>

const socialData = {
  twitter: {
    url: 'https://twitter.com/',
    Ico: TwitterIcon,
  },
  linkedin: { url: 'https://www.linkedin.com/in/', Ico: LinkedInIcon },
  github: { url: 'https://github.com/', Ico: GithubIcon },
}

type NormalizedSocialLink = LinkModel & {
  Ico: (props: React.SVGProps<SVGSVGElement>) => JSX.Element
}
const formatSocialHandle = (
  handleValue: string,
  type: keyof typeof socialData
): NormalizedSocialLink => {
  const socialLink = socialData[type]
  const label = stripTrailingSlash(handleValue.replace(socialLink.url, '@'))
  const link = handleValue

  return {
    label,
    link,
    Ico: socialLink.Ico,
  }
}

export type NormalizedSocialLinkMap = Record<
  keyof SocialLinks,
  NormalizedSocialLink
>
const formatSocialHandles = (options: SocialLinks): NormalizedSocialLinkMap => {
  return {
    github: formatSocialHandle(options.github, 'github'),
    twitter: formatSocialHandle(options.twitter, 'twitter'),
    linkedin: formatSocialHandle(options.linkedin, 'linkedin'),
  }
}
