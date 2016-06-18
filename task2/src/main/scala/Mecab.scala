import scala.sys.process._
import com.github.tototoshi.csv._

object Mecab {
  val neologdPath = "/usr/local/lib/mecab/dic/mecab-ipadic-neologd"

  def parse(string: String): Seq[MecabNode] = {
    val csvParser = new CSVParser(defaultCSVFormat)
    val parsed = s"echo $string" #| s"mecab -d $neologdPath" !!

    parsed.split('\n').map {
      _.split('\t') match {
        case Array(surfaceForm, tail) => csvParser.parseLine(tail) match {
          case Some(Seq(pos, posSec1, posSec2, posSec3, conjugatedForm, conjugateType, originalForm, reading, pronoun)) => {
            Some(MecabNode(surfaceForm, pos, posSec1, posSec2, posSec3, conjugatedForm, conjugateType, originalForm, reading, pronoun))
          }
          case _ => None
        }
        case _ => None
      }
    }.flatMap(x => x)
  }
}

case class MecabNode(surfaceForm: String,
                     pos: String,
                     posSec1: String,
                     posSec2: String,
                     posSec3: String,
                     conjugatedForm: String,
                     conjugateType: String,
                     originalForm: String,
                     reading: String,
                     pronoun: String)
