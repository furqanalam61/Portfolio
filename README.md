# Furqan Alam — Portfolio

A responsive React portfolio inspired by the dark, editorial feel of [ahmadgill.com](https://ahmadgill.com/).

## Run locally

```sh
npm install
npm run dev
```

## Static content and media

The published portfolio reads its content (including project, skills, experience, and education entries) from the checked-in `public/content.json`. Public media is stored in the project and referenced by paths in that JSON:

- `public/media/profile/` — portrait images
- `public/media/cv/` — CV files
- `public/media/projects/` — project galleries

To update the site, edit content in `/admin` and choose **Prepare export**. Click **Download ZIP**, extract its contents into the project's `public/` folder, and replace existing files when prompted. The ZIP contains `content.json` and the media files in their matching folders. Review and commit those project files, then redeploy. The live website always reads this published JSON and its media files; browser storage is only a local admin editing draft.

No database or server is used. Admin edits are not published until the exported files are committed and deployed.
