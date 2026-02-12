# Template Attachments

This directory contains files that are automatically attached when you select a template.

## Files

- `sponsorship-preview.png` (Default): A placeholder image included with the template.

## How to use a PDF as the default attachment

1.  **Delete or rename** the current `sponsorship-preview.png`.
2.  **Upload or copy** your PDF file into this folder.
    - Example: `my-sponsorship-packet.pdf`
3.  **Update the Template Config**:
    - Open `templates/artemis-sponsorship.json`
    - Change the `"attachments"` list to point to your new file:
      ```json
      "attachments": [
        "templates/attachments/my-sponsorship-packet.pdf"
      ]
      ```
4.  Commit and push your changes to GitHub to save them permanently.
